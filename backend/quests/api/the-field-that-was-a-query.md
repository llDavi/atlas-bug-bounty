---
slug: "api-the-field-that-was-a-query"
title: "The Field That Was a Query"
kingdom: "api"
place: "overfull-manifest"
order: 2
xp: 260
difficulty: 3
minutes: 30
requires: []
skills: ["sqli"]
attributes: { exploitation: 2, logic: 2 }
summary: "A JSON value is still input. Send an operator instead of a string, a type the code did not expect, or ask a filter for fields it should not return — the API trusts the shape of your data."
---

Every injection from the Web Realm reaches an API too — it just travels inside a JSON value instead of a form field. And APIs add a twist: JSON has *types*, so you can send an object where a string was expected, and the code behind it may do something it never planned. The API trusts not just your values but the shape of your data.

## The operator in place of a value

A JSON login on a NoSQL store expects strings. Send an object instead:

```json
{"username": "admin", "password": {"$gt": ""}}
```

`{"$gt": ""}` means "greater than empty", true for any password — a login bypass with no quote anywhere. The same shape reads other users' data (`{"$ne": null}`) or injects into a query. Whenever a field takes a string, try sending an object or an array.

```question
id: nosql-operator
prompt: A JSON API login accepts the password as an object meaning "greater than empty string" instead of a real password, and logs you in. Sending an operator object where a string was expected is which vulnerability class?
answer: NoSQL injection
accept: [nosql injection, nosqli, no-sql injection, operator injection, mongodb injection]
hint: You inject a query operator into a NoSQL database via the JSON type.
```

## The type the code did not expect

**Type confusion** is broader than NoSQL. Code that assumes a field is a string may crash, skip a check, or behave oddly when it receives a number, a boolean, or an array. A classic: `{"user_id": [1024]}` where the app expected `1024` — the array slips past a naive equality check, or the app uses the first element in one place and the whole array in another. Fuzz the *type* of each field, not only its value.

```question
id: type-confusion
prompt: An endpoint expects user_id as a number, but sending it as an array like [1024] makes a check behave unexpectedly. What is fuzzing the data type of a field (string vs number vs array vs object) exploiting?
answer: type confusion
accept: [type confusion, type juggling, type mismatch, unexpected types, type coercion]
hint: The code assumed one type and got another.
```

## Classic injection, JSON-wrapped

SQL injection, command injection and SSTI all still apply — inside the value. A search field in JSON reaches a SQL query just the same:

```json
{"query": "chair' OR '1'='1"}
```

The API being JSON changes nothing about the database behind it. Test injections in every value that looks like it feeds a query, a lookup, or a command.

```question
id: sqli-json
prompt: A search API takes a JSON field whose value is put into a SQL query, and a single quote in that value produces a database error. Does the request being JSON instead of a form make SQL injection any less applicable?
answer: no
accept: [no, no it does not, it still applies, sqli still applies, no difference, it is the same]
hint: The database behind the API does not care what format delivered the value.
```

## Asking for fields you should not get

Some APIs let the client choose which fields to receive with a `fields=` or `include=` parameter — a convenience that becomes over-exposure when you request fields the UI hides:

```
GET /api/v1/users/1024?fields=id,name,ssn,password_hash
```

If the server honours arbitrary field names, you pull `ssn` and `password_hash` it never meant to expose. Always try adding sensitive field names to any field-selection parameter.

```question
id: field-selection
prompt: An API lets you pick returned fields with a fields= parameter, and adding ssn and password_hash to it returns them. What flaw does honouring arbitrary field names create?
answer: excessive data exposure
accept: [excessive data exposure, over-exposure, data exposure, information disclosure, it exposes sensitive fields, returning sensitive fields]
hint: You made the API overshare by naming the fields yourself.
```

> A JSON field is input with a type. Send an operator where a value was expected, change the type the code assumed, wrap the same old injections in JSON, and name the sensitive fields the selector will hand you. The API trusts the shape of your data as much as its content.
