---
slug: "the-database-speaks"
title: "The Database Speaks"
kingdom: "web"
place: "stonewatch"
order: 1
xp: 280
difficulty: 3
minutes: 40
requires: []
skills: ["sqli"]
attributes: { exploitation: 3, logic: 1 }
summary: "When your input is glued into a query instead of bound to it, you stop being data and start being instructions. SQL injection, from the login bypass to the blind time delay."
---

A database query is a sentence, and your input is supposed to be a *quoted word* in it. **SQL injection** happens when the app builds the sentence by pasting your input in as text — so you close the quote and add your own clause. Now you are not answering the query, you are writing it.

## The break that proves it

The oldest tell: put a single quote where the app expects a word and watch it choke.

```
GET /product?id=15'
->  500 Internal Server Error
    You have an error in your SQL syntax near "'"
```

That error means your quote reached the query unescaped — the app concatenated `... WHERE id = '15''`. The database is speaking to you. From here, `id=15' OR '1'='1` returns every row, and on a login form `' OR 1=1 --` can make the `WHERE username=... AND password=...` clause always true, logging you in as the first user.

```question
id: quote-break
prompt: Adding a single quote to a parameter returns a SQL syntax error mentioning your quote. What does that error prove about how the app built the query?
answer: it concatenated your input
accept: [it is injectable, your input reached the query, it is not parameterised, input is concatenated, unsanitised concatenation, it glued input into the query, sql injection]
hint: Your quote arrived in the query unescaped instead of being safely bound.
```

## Pulling data out with UNION

Once inside a `SELECT`, `UNION SELECT` appends your own row to the results, letting you read other tables — usernames, hashes, tokens. You first match the column count, then select what you want:

```
?id=-1 UNION SELECT username, password FROM users --
```

The `-1` makes the original row empty so only your injected data shows. This is how a product page becomes a dump of the credentials table.

```question
id: union
prompt: Inside an injectable SELECT, which SQL keyword lets you append rows from a different table, such as usernames and password hashes, onto the page's results?
answer: UNION
accept: [union, union select]
hint: It unions your own SELECT onto the app's query.
```

## When there is no output: blind

Often the page shows no data and no error — only "found" or "not found". You still win, by asking **true/false** questions and reading the difference. Boolean-blind:

```
?id=15 AND 1=1   -> product shown   (true)
?id=15 AND 1=2   -> product missing (false)
```

Now every question — *is the first letter of the admin's password an "a"?* — is a true/false you can automate. And when even that is invisible, **time-based** blind asks the database to pause:

```
?id=15 AND SLEEP(5) --
```

If the response takes five seconds, the condition was true. Slow, but total.

```question
id: blind-time
prompt: A page returns the same thing whether your injected condition is true or false, but adding a SLEEP of 5 seconds makes the response take five seconds only when the condition is true. What is this technique called?
answer: time-based blind SQL injection
accept: [time-based blind, time based sqli, time-based sql injection, blind time-based, time based blind sqli]
hint: You read the answer from how long the response takes.
```

## The one real fix, and its cousin NoSQL

Every one of these dies against **parameterised queries** (prepared statements), where input is *bound* as data and can never become part of the sentence. Escaping is a patch; binding is the fix. And the same class exists beyond SQL: **NoSQL injection** in a MongoDB app lets you send an operator instead of a value —

```json
{"username": "admin", "password": {"$ne": null}}
```

`$ne: null` means "password not equal to null", which is always true — a login bypass with no quote in sight.

```question
id: nosql
prompt: A MongoDB login accepts JSON, and sending the password as an object meaning "not equal to null" instead of a string logs you in as admin. What class of vulnerability is that?
answer: NoSQL injection
accept: [nosql injection, no-sql injection, nosqli, mongodb injection]
hint: Same idea as SQLi, but you inject a query operator into a NoSQL database.
```

> The database will speak to whoever writes the sentence. Prove the break with a quote, pull data with UNION, and when the page goes quiet, read the answer from a true/false difference or a five-second pause. The fix is always the same — bind the input as data — and the same flaw waits, un-quoted, in every NoSQL store.
