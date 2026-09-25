---
slug: "the-errand-boy"
title: "The Errand Boy"
kingdom: "web"
place: "stonewatch"
order: 2
xp: 300
difficulty: 4
minutes: 40
requires: []
skills: ["ssrf"]
attributes: { exploitation: 3, logic: 2 }
summary: "Make the server fetch a URL you choose, or run a command, or render a template with your input — three ways to turn a feature into code execution or the keys to the cloud."
---

The most valuable server-side bugs make the *server itself* act on your input — fetch a URL, run a command, render a template. The server sits inside the network you cannot reach and holds credentials you cannot see, so turning its own features against it is how a hunter reaches the internal keep and, often, the cloud account behind it.

## The messenger who fetches any scroll

**SSRF** — server-side request forgery — is a feature that fetches a URL you supply: a webhook, a "import from URL", an image proxy, a PDF renderer. You point it inward instead of outward:

```
POST /api/import   { "url": "http://localhost:8080/admin" }
```

The server, trusted on its own network, reaches services *you* cannot — internal admin panels, databases, the metadata service. On a cloud host the crown jewel is the metadata endpoint, which hands out the machine's IAM credentials to anything on the box:

```
url=http://169.254.169.254/latest/meta-data/iam/security-credentials/app-role
->  {"AccessKeyId":"ASIA...","SecretAccessKey":"...","Token":"..."}
```

That single fetch can return live AWS keys — an SSRF that becomes account compromise.

```question
id: ssrf-metadata
prompt: An "import from URL" feature lets you set the server's request to http://169.254.169.254/latest/meta-data/. On a cloud host, what does that internal metadata address hand back that turns SSRF into account compromise?
answer: cloud credentials
accept: [iam credentials, aws credentials, cloud credentials, the instance credentials, iam role credentials, temporary aws keys, access keys]
hint: The metadata service gives any process on the box the machine's IAM keys.
```

```question
id: ssrf-what
prompt: A webhook feature fetches whatever URL you give it, and you point it at http://localhost/admin to reach a service only the server can see. What is this vulnerability called?
answer: SSRF
accept: [ssrf, server-side request forgery, server side request forgery]
hint: You forge a request that the server makes on your behalf.
```

## The command line under the feature

When an app shells out to a system command and drops your input into it, **command injection** lets you add commands. A "ping this host" tool:

```
POST /tools/ping   host=8.8.8.8; id
->  ...
    uid=33(www-data) gid=33(www-data)
```

The `;` ended the ping and ran `id`. Shell metacharacters — `;`, `|`, `&&`, `$(...)`, backticks — are the payloads. When there is no output, it goes blind exactly like SQLi: `; sleep 5` or exfiltrate over DNS.

```question
id: cmdi
prompt: A "ping a host" feature runs a system command with your input, and sending 8.8.8.8; id returns the output of the id command. Which character let you end the ping and start your own command?
answer: semicolon
accept: [;, a semicolon, the semicolon, semi-colon]
hint: It is the shell separator between two commands.
```

## The template that evaluates you

Server-side template engines (Jinja2, Twig, Freemarker) render pages by evaluating expressions. If your input is put into the *template* rather than passed to it, **SSTI** lets you evaluate your own expressions — and most engines reach objects that run code. The probe is arithmetic:

```
name={{7*7}}   ->  Hello, 49
```

`49` coming back means the server evaluated your expression — it did not treat `{{7*7}}` as text. From that foothold you climb to reading files and running commands through the engine's objects.

```question
id: ssti
prompt: You put a template expression multiplying seven by seven into a name field, and the page greets you with 49 instead of the literal text. What did that prove the server is doing with your input?
answer: evaluating it
accept: [evaluating the template, it evaluates your input, server-side template injection, rendering it as a template, ssti, it executes the expression, evaluating the expression]
hint: It computed 49, so your string was run as a template expression, not printed.
```

> Three features, one idea: your input becomes an action the server takes. It fetches the URL you chose — sometimes the cloud's own keys — runs the command you appended, or evaluates the expression you slipped into a template. These are the bugs that move a hunter from the edge of the network to code running inside it.
