---
slug: "reading-what-they-ship"
title: "Reading What They Ship"
kingdom: "web"
place: "forest-of-recon"
order: 3
xp: 260
difficulty: 3
minutes: 35
requires: []
skills: ["recon"]
attributes: { recon: 3, logic: 1 }
summary: "The app ships you its own JavaScript and its history sits in the Wayback Machine. Mine both for endpoints, parameters and keys nobody meant to publish."
---

The richest recon is the code the target hands you itself. Every SPA ships a bundle of JavaScript that names its endpoints; every site has a past preserved in public archives. Mining the JavaScript and the archives turns up the endpoints and parameters that no crawl and no wordlist ever would — because the app *told you about them*.

## The endpoints hidden in the bundle

A minified `main.js` is not secret; it is a directory of the API. Pull every URL-looking string out of it (`LinkFinder`, or a simple regex) and you get the real endpoint list:

```
python3 linkfinder.py -i https://app.target.com/main.js -o cli

/api/v1/users
/api/v1/users/{id}/roles
/api/v2/internal/export
/admin/api/impersonate
```

`/admin/api/impersonate` never had a button. The front-end code carried its address, because the same bundle serves admins and users — it just hides the admin buttons in the UI, not the routes.

```question
id: js-endpoints
prompt: Extracting URLs from main.js reveals /admin/api/impersonate, an endpoint no button on the site calls. Why does the client-side bundle know about admin routes an ordinary user should never reach?
answer: the same bundle serves everyone
accept: [same bundle, one bundle for all, the ui only hides the buttons, it hides buttons not routes, the frontend hides buttons only, same code for admins and users]
hint: The UI hides the admin buttons, not the code behind them.
```

## The site's own past

`gau` and `waybackurls` pull every URL the internet ever recorded for a domain — old pages, dead parameters, retired endpoints that may still answer:

```
echo target.com | gau | grep "=" | sort -u

/search?q=test&debug=true
/download?file=report.pdf
/api/v1/legacy/getUser?id=5
```

`debug=true` and a `file=` parameter that takes a path are gifts from the archive. Old routes are often the least maintained — the `/api/v1/legacy/` that everyone forgot still runs.

```question
id: wayback
prompt: waybackurls surfaces an old /download?file=report.pdf URL from years ago. Even if it is not linked anywhere today, why is a retired endpoint like that worth testing?
answer: it is unmaintained
accept: [unmaintained, least maintained, old code is weaker, legacy is weaker, forgotten and unpatched, it may still work and be unpatched]
hint: The routes nobody has touched in years are the ones nobody has fixed.
```

## The parameters that are not in the form

An endpoint often accepts parameters the form never shows — a leftover `admin=`, `debug=`, or `format=`. **Parameter mining** (`arjun`, or a wordlist through the query string) brute-forces parameter names and watches for a response that changes:

```
arjun -u https://api.target.com/api/v1/users/5

[+] parameter 'fields' reflected
[+] parameter 'include_deleted' changed the response
```

`include_deleted=true` on a users endpoint is exactly the kind of hidden switch that returns data you should not see.

```question
id: param-mining
prompt: Arjun brute-forces parameter names against an endpoint and finds that adding include_deleted changes the response. What is this technique called?
answer: parameter mining
accept: [parameter discovery, param mining, param discovery, parameter fuzzing, parameter bruteforcing]
hint: You are discovering parameters the form never showed.
```

## Drawing the map

All of it — subdomains, live hosts, stacks, paths, endpoints, parameters — is only useful assembled into one **attack surface map**: every place that takes input and every trust boundary between them. The bug is almost never in the pretty page; it is in the seam between two services you only saw because you mapped them both.

```question
id: attack-surface
prompt: After recon you assemble hosts, endpoints, parameters and trust boundaries into a single picture. What is that picture called — the thing a hunter tests against rather than the marketing homepage?
answer: the attack surface
accept: [attack surface, the attack surface map, attack surface map]
hint: It is the sum of every place the target takes input.
```

> The application documents itself: its JavaScript names the routes, the archive keeps the old ones, and mining reveals the parameters the form hides. Read what they ship, and you test the surface they actually run — not the one they show you.
