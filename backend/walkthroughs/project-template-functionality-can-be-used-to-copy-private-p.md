---
title: "Project Template functionality can be used to copy private project data, such as repository, confidential issues, snippets, and merge requests"
slug: "project-template-functionality-can-be-used-to-copy-private-p"
platform: "hackerone"
vuln_class: "Privilege Escalation"
difficulty: "hard"
scope_type: "web"
bounty: 12000
program: "GitLab"
reporter: "jobert"
published_at: "2019-11-27"
source_url: "https://hackerone.com/reports/689314"
tags: []
teaser: "A seemingly innocent project cloning feature silently exfiltrated private repositories, confidential issues, and sensitive data across trust boundaries."
---

## The Program

GitLab is one of the most widely used DevOps platforms in the world, offering source code management, CI/CD pipelines, issue tracking, and project collaboration tools to millions of developers and organizations. Its self-hosted and SaaS variants (gitlab.com) are used by teams ranging from small startups to Fortune 500 companies and government agencies. GitLab runs an active bug bounty program on HackerOne and is known for paying competitive bounties, particularly for vulnerabilities that affect the confidentiality of user data or allow privilege escalation across organizational boundaries.

The specific functionality under investigation here is GitLab's **Enterprise Edition (EE) Project Template** feature. This feature allows organizations to define "template" projects within a group, which other members can then use as a starting point when creating new projects — essentially a copy operation initiated server-side. Because this involves exporting and importing project data, it touches some of the most sensitive parts of the platform: repositories, issues, snippets, merge requests, and CI configuration.

What made this attack surface particularly interesting is the intersection of GitLab CE (Community Edition) and EE (Enterprise Edition) code paths. EE prepends additional logic on top of CE controllers and services, and these seams — where EE validation is meant to gate CE functionality — are historically fertile ground for authorization bypass bugs. Any time a platform layers access control on top of a powerful data-movement feature, the authorization chain deserves careful scrutiny.

---

## The Recon

The starting point for this investigation was the project creation flow at `/projects/new`. Intercepting the `POST /projects` request with a proxy like Burp Suite reveals a multipart form submission containing fields like `project[name]`, `project[namespace_id]`, `project[template_name]`, `project[use_custom_template]`, and `project[group_with_project_templates_id]`. Most of these parameters appear in normal usage, but `use_custom_template` and `group_with_project_templates_id` are EE-only parameters that are easy to overlook unless the source code is being read alongside the traffic.

GitLab's codebase is open source for the CE portion and partially public for EE, making it possible to trace exactly how these parameters are processed. Reading `ee/app/controllers/ee/projects_controller.rb` reveals that EE adds its own permitted parameter list via `project_params_ee`, which includes `use_custom_template` and `group_with_project_templates_id`. These are merged with CE's permitted params — including `template_name` — before being passed to `Projects::CreateService`. The fact that all three of these parameters could be submitted together in a single request was the first key observation.

Tracing the service layer next, the EE `CreateService` prepend in `ee/app/services/ee/projects/create_service.rb` contains a `validate_namespace_used_with_template` method that is supposed to enforce that a project using a custom group template can only be created within a descendant namespace of that template group. However, the very first line of that method is `return unless project.group` — meaning the entire validation is skipped when the destination namespace is a personal user namespace rather than a group. This is a classic guard clause that guards too little.

Following the chain further into `ee/app/services/ee/projects/create_from_template_service.rb` and then `ee/app/services/ee/projects/gitlab_projects_import_service.rb` revealed the full picture: a bypassed authorization check feeds into an export job scheduler that assumes authorization has already been verified. The export is then automatically imported into the attacker's project. By mapping each hop in the service chain, the three discrete weaknesses and their combined effect became apparent.

---

## The "Wait a Second..." Moment

The critical realization arrived while reading the `validate_namespace_used_with_template` method. The method is clearly designed to enforce a namespace relationship — "the project must be created inside a group that descends from the template group" — but the `return unless project.group` guard means that creating the project under a personal user namespace causes the entire authorization block to be silently skipped. The parameters `use_custom_template` and `group_with_project_templates_id` remain set on the `params` hash and continue propagating downstream as if they had been validated.

The second realization followed immediately: even if the authorization weren't bypassed, the `available_custom_project_templates` method uses `ProjectsFinder` with a pre-filtered project ID list, but `ProjectsFinder` applies visibility checks without verifying the user's access level to specific project features (repository, issues, snippets). This means a public project that has its repository and issues restricted to "Project Members Only" would still be returned as a valid template candidate. Together, these two flaws meant a completely unauthorized export of private project data could be triggered — and the export worker would execute it with no further authorization check.

---

## The Exploit

Exploitation requires two GitLab accounts: one acting as the victim (who owns or can identify a target project) and one acting as the attacker.

**Step 1 — Identify a target project.** The target must be a public project that belongs to a group and has features such as Repository, Issues, or Snippets restricted to "Only Project Members." Public GitLab groups like `gitlab-org`, `gitlab-com`, and `gitlab-data` on gitlab.com contain many such projects. Note the target project's name and its parent group's numeric ID (visible in the group's Settings page or via the API at `/api/v4/groups/<groupname>`).

**Step 2 — Set up the attacker's account.** Sign in as the attacker. Navigate to `https://gitlab.com/projects/new` and begin filling out the new project form. Before submitting, open Burp Suite and enable request interception.

**Step 3 — Intercept and modify the creation request.** Submit the new project form. The intercepted `POST /projects` request will contain standard fields. Modify the request body to inject the following parameters:

```
project[use_custom_template]=true
project[template_name]=<target_project_name>
project[group_with_project_templates_id]=<target_group_id>
project[namespace_id]=<attacker_user_namespace_id>
project[name]=stolen_copy
project[path]=stolen_copy
```

The key manipulation is setting `namespace_id` to the attacker's personal namespace (not a group), which triggers the `return unless project.group` bypass and skips the template authorization check entirely.

**Step 4 — Forward the request.** The server responds with a redirect to the newly created project page, which displays a banner indicating the project is being imported. No error is shown because the authorization was bypassed, not triggered.

**Step 5 — Wait for the export/import cycle.** GitLab's export worker runs asynchronously. Depending on Sidekiq queue depth and project size, the process may take a few minutes. Once complete, the attacker's project will contain a full copy of the target's repository, confidential issues, private snippets, merge requests, CI pipeline history, milestones, labels, LFS objects, and issue boards.

**What successful exploitation looks like:** The attacker's project mirrors the private contents of the target. Files in the repository are browsable, confidential issues are readable, and merge request diffs are visible — all data that was never authorized to be shared.

---

## The Report

A well-structured report for this class of vulnerability needs to accomplish three things quickly: establish that data was accessed without authorization, show a clear and reproducible chain of steps, and quantify the blast radius.

**Title:** The report title used here is exemplary — "Project Template functionality can be used to copy private project data, such as repository, confidential issues, snippets, and merge requests." It names the feature, the action (copy), and the data types affected. A triager reading this title immediately understands the scope without opening the body.

**Severity justification:** This is a Critical because it allows a completely unprivileged external user to exfiltrate the full contents of any public project with restricted features — including source code and confidential issues. On a platform like GitLab where organizations store proprietary code and security-sensitive discussions, this is a maximum-impact confidentiality breach. The justification should cite the CVSS dimensions explicitly: network-accessible, no authentication beyond a normal account, no user interaction from the victim, complete confidentiality impact.

**Reproduction steps:** The report excels here by providing exact parameter names and values, a representative HTTP request with comments indicating which fields to change, and a clear description of what the server response will look like at each stage. Every field in the request is explained. Beginners should follow this model exactly — triagers should be able to reproduce the bug without asking a single clarifying question.

**Impact statement:** The impact section enumerates every data type exposed (repositories, wiki, uploads, configuration, issues, merge requests, labels, milestones, snippets, LFS objects, issue boards). It also names specific real-world examples on gitlab.com to demonstrate exploitability at scale, rather than speaking in hypotheticals. Concrete examples dramatically increase the speed of triage and severity agreement.

**Attachments:** Screenshots of the restricted project settings, the intercepted HTTP request, and the final attacker project containing the copied data serve as undeniable proof. Always include before/after screenshots showing the restriction was real and that it was bypassed.

---

## The Takeaway

The core insight is that when a platform chains multiple service layers together and only the outermost layer performs authorization, any bypass of that outer check allows the entire chain — including powerful operations like project export — to execute without restriction.

To find similar bugs, look for any multi-step server-side operation that involves a "template," "clone," "import," or "copy" action, and trace whether authorization is validated at every step in the chain or only at the entry point. Platforms that layer enterprise features on top of community features (EE on CE, Pro on Free, etc.) are especially prone to this pattern because the seams between the two codebases introduce implicit trust assumptions.

Guard clauses that exit early — `return unless X` — deserve particular attention. Each one represents a code path where downstream logic executes with some precondition unverified. When that precondition is authorization-related, early returns become authorization bypasses.

Tools that help with this class of research include Burp Suite for intercepting and replaying modified requests, and direct source code review on platforms that publish their code openly. For GitLab specifically, the open-source CE codebase combined with publicly disclosed EE code in changelogs and merge requests provides enough visibility to trace service chains without black-box fuzzing alone. Common variants of this vulnerability appear in any system with asynchronous job queues (Sidekiq, Celery, BullMQ) where authorization is checked at job scheduling time but not re-verified at job execution time — a TOCTOU window that can be exploited when permissions change or were never properly set.
