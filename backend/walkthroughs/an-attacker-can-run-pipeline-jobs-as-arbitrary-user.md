---
title: "An attacker can run pipeline jobs as arbitrary user"
slug: "an-attacker-can-run-pipeline-jobs-as-arbitrary-user"
platform: "hackerone"
vuln_class: "Business Logic Errors"
difficulty: "hard"
scope_type: "web"
bounty: 12000
program: "GitLab"
reporter: "u3mur4"
published_at: "2020-08-26"
source_url: "https://hackerone.com/reports/894569"
tags: []
teaser: "A misconfigured pipeline execution context allowed full identity impersonation without any elevated permissions."
---

## The Program

GitLab is one of the most widely deployed DevOps platforms in the world, offering source code management, CI/CD pipelines, container registries, and project management under a single roof. The platform serves millions of developers across both the self-hosted Community Edition and the cloud-hosted GitLab.com SaaS offering. Because GitLab handles source code — often the most sensitive asset a company owns — its bug bounty program on HackerOne has historically offered some of the highest payouts in the industry, with critical vulnerabilities commanding five-figure bounties.

The GitLab bug bounty program explicitly scopes CI/CD pipeline functionality as high-interest attack surface. This makes sense: pipelines execute arbitrary code with elevated credentials, including the `CI_JOB_TOKEN`, which grants access to private repositories, container registries, and group-level resources that the triggering user has permission to access. Any mechanism that allows an attacker to influence who "triggers" a pipeline is therefore a privilege escalation primitive by definition.

Repository mirroring — a feature that pulls changes from an upstream repository into a GitLab project — was particularly worth examining. It sits at the intersection of access control (who owns the downstream project), authentication (whose credentials run the resulting pipeline), and automation (pipelines fire without direct human interaction). The combination of those three properties in one feature creates a rich environment for business logic flaws.

---

## The Recon

Reconnaissance focused on GitLab's repository mirroring feature, accessible under **Project Settings → Repository → Mirroring repositories**. The key options on that page are: the upstream `Git repository URL`, the `Mirror direction` (Push or Pull), and a checkbox labeled **"Trigger pipelines for mirror updates"**. That final checkbox is the critical detail — it means that whenever the upstream repository pushes a new commit, the downstream mirrored project fires its own CI/CD pipeline using the `.gitlab-ci.yml` file pulled from the upstream source.

The next observation concerns pipeline ownership. When a pipeline runs in GitLab, it runs in the context of a specific user — the "triggerer." That triggerer's `CI_JOB_TOKEN` is injected as an environment variable into every job in the pipeline. This token grants the same repository-access permissions as the triggering user, meaning it can be used to clone any private repository that user has access to. Mapping which user becomes the triggerer under various conditions was the core research question.

Group membership and ownership inheritance rules then came under scrutiny. GitLab groups can have multiple owners. If a project lives inside a group, the project inherits membership from that group. When a group owner deletes their account, GitLab must promote or fall back to another owner to maintain group integrity. The question became: what happens to automated pipeline triggers — specifically, mirror-triggered pipelines — when the account that originally configured the mirroring is deleted? The answer turned out to involve a fallback to another owner in the group, and that fallback was not adequately validated before being used as a pipeline triggerer.

---

## The "Wait a Second..." Moment

The critical realization arrived when the account deletion of Attacker2 — who had configured the mirroring — caused the pipeline trigger identity to silently reassign to the Victim user, the only remaining owner in the `test` group. The mirrored project (`test/poc`) continued running pipelines on schedule, but the `CI_JOB_TOKEN` injected into those jobs now belonged to the Victim. Meanwhile, the `.gitlab-ci.yml` file driving those jobs was still controlled entirely by Attacker1, whose upstream repository was being mirrored. The content of that file — arbitrary shell commands — was dictated by the attacker, but executed with the credentials of the victim.

The asymmetry is the bug: ownership of the pipeline's *instructions* and ownership of the pipeline's *identity* had been completely decoupled. GitLab was executing attacker-controlled scripts under victim-owned tokens, with no validation that the user whose credentials were being used had ever reviewed or approved those scripts. Deleting one account severed the authorization chain and the system failed open.

---

## The Exploit

The attack required three accounts: Attacker1, Attacker2, and the Victim. Below is the complete exploitation sequence.

**Step 1 — Set up the payload repository (Attacker1)**
- Create a public GitLab project (e.g., `attacker1/poc`) initialized with a README.
- Add a benign `.gitlab-ci.yml` as a placeholder (the malicious payload is added later to avoid detection):

```yaml
image: "ruby:2.6"
before_script:
  - echo Hello
rspec:
  script:
    - echo Hello
```

**Step 2 — Create the trap project (Attacker2)**
- Register a second attacker account and create a public group named `test`.
- Inside that group, create a public project named `poc`.
- Navigate to **Project Settings → Repository → Mirroring repositories** and configure:
  - `Git repository URL`: the upstream `attacker1/poc` repository URL
  - `Mirror direction`: Pull
  - Enable **"Trigger pipelines for mirror updates"**

**Step 3 — Lure the Victim into the group**
- From Attacker2, navigate to **Group → Members** and invite the Victim user with the `Owner` role. This can be done via a social engineering pretext (e.g., offering collaboration on an open-source project).

**Step 4 — Delete Attacker2's account**
- From Attacker2's **Account Settings → Account**, delete the account. Because the Victim is also an Owner in the `test` group, GitLab allows the deletion to proceed. Responsibility for the mirrored project transfers implicitly to the Victim.

**Step 5 — Deploy the payload (Attacker1)**
- Update `attacker1/poc/.gitlab-ci.yml` to the data-exfiltration payload:

```yaml
image: "ruby:2.6"
rspec:
  script:
    - git clone https://gitlab-ci-token:$CI_JOB_TOKEN@gitlab.com/victim/private_repo_name.git
    - cd private_repo_name
    - ls -lah .
    - cat README.md
```

**Step 6 — Wait for the mirror sync**
GitLab polls upstream mirrors roughly every 30 minutes. When the sync fires, `test/poc` pulls the new `.gitlab-ci.yml`, starts a pipeline, and injects the Victim's `CI_JOB_TOKEN`. The job clones the Victim's private repository and outputs its contents to the job log, which Attacker1 can read because `attacker1/poc` is public and `test/poc` is also public.

Successful exploitation is confirmed when the job log displays the contents of `victim/private_repo_name`'s files — data the attacker has no legitimate access to.

---

## The Report

The report title used was direct and accurate: **"An attacker can run pipeline jobs as arbitrary user."** Effective titles name both the capability gained (run pipeline jobs) and the scope (arbitrary user), so a triager immediately understands the blast radius without reading the body.

Severity was justified at Critical (CVSS 9.6) because the attack is network-exploitable with no privileges required on the victim's account, requires only low-effort social engineering (a group invitation), and results in complete compromise of the victim's `CI_JOB_TOKEN` — granting read access to all private repositories and registries the victim can access.

The reproduction steps were structured around three distinct actors (Victim, Attacker1, Attacker2), clearly labeled and sequenced. This three-actor structure is important: it shows the triager exactly which actions each account performs, prevents confusion about which session is active, and makes the report independently reproducible. The exploit was accompanied by a working `.gitlab-ci.yml` payload so the triager could verify impact without guessing.

The impact statement extended beyond the immediate PoC. Rather than just noting "we cloned a private repo," the report enumerated the full scope of `CI_JOB_TOKEN` capabilities: private repositories, member-only repositories, container registries. Enumerating downstream impacts is what converts a "medium" read in a triager's mind to a "critical" — it forces the reader to confront everything that token can reach, not just the single demonstration artifact.

---

## The Takeaway

The core insight is: **whenever an automated action inherits the identity of a human user, any mechanism that allows the action's *configuration* and the action's *identity* to be controlled by different parties is a potential privilege escalation.**

Similar bugs appear wherever account deletion or ownership transfer interacts with persistent, automated processes: webhook deliveries, scheduled reports, OAuth application grants, and recurring background jobs are all candidates. The pattern to search for is: "what automated task was configured by User A, now runs under User B's credentials, and can still be influenced by an attacker?" Answering that question across any platform's automation surface is a reliable source of critical findings.

Tools useful for this class of research include Burp Suite (to intercept and replay API calls that configure automation), GitLab's own API (to enumerate mirror configurations and pipeline triggerer fields via `/api/v4/projects/:id/mirror/pull`), and simply reading the platform documentation for any feature that references "scheduled," "automatic," or "triggered" actions. Common variants include deploy tokens with excessive scope, pipeline trigger tokens shared across projects, and CI variables inherited from parent groups — each of which can become a lateral-movement primitive if the authorization logic is handled incorrectly during account lifecycle events.
