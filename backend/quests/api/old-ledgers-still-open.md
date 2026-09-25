---
slug: "api-old-ledgers-still-open"
title: "Old Ledgers Still Open"
kingdom: "api"
place: "common-ledger"
order: 2
xp: 220
difficulty: 2
minutes: 25
requires: []
skills: ["recon"]
attributes: { recon: 2, logic: 1 }
summary: "One resource has many doors: an older API version still deployed, a SOAP service beside the REST one, an endpoint that also accepts XML. Old and alternate shapes are where the fixes never reached."
---

An API is rarely one clean thing. Versions pile up, old protocols linger, and the same endpoint often accepts more than one format. Each of these is a *different door to the same resource*, and a fix applied to the new door frequently never reached the old one. Finding the forgotten shape is half of API hunting.

## The version they forgot to retire

APIs version in the path: `/api/v1/…`, `/api/v2/…`. When a team ships v2 to fix a bug, v1 usually stays deployed for old clients — often unpatched. If `/api/v2/users/1024` now checks ownership but `/api/v1/users/1024` still exists, the fix is one character away from being undone:

```
GET /api/v2/users/1024   ->  403 Forbidden   (fixed)
GET /api/v1/users/1024   ->  200 OK          (still vulnerable)
```

Whenever you see a version number, try the ones before it.

```question
id: versioning
prompt: The v2 endpoint now returns 403 for an object that is not yours, but changing the path to v1 returns 200 with the data. What should you always try when you see an API version number in the path?
answer: older versions
accept: [older versions, previous versions, try v1, earlier versions, the older version, lower version numbers]
hint: The fix often landed only on the newest version.
```

## The service beside the service

Older systems expose **SOAP/XML** endpoints alongside modern REST. A SOAP service advertises itself with a WSDL — a machine-readable description of every operation — usually at `?wsdl`:

```
GET /billing/service?wsdl
->  <definitions> ... <operation name="transferFunds"> ... <operation name="adminReset"> ...
```

Like GraphQL introspection, the WSDL hands you the full list of operations, including ones no client calls. And SOAP is XML, which drags along the whole XXE family from the Web Realm.

```question
id: wsdl
prompt: A legacy endpoint responds at ?wsdl with a document listing every operation the SOAP service offers, including transferFunds and adminReset. What does that WSDL give a hunter, much like GraphQL introspection?
answer: the list of operations
accept: [the list of operations, all the operations, the service methods, every operation, the full api, the methods, a map of the service]
hint: It describes the whole service, including operations no client calls.
```

## The format it also accepts

Many endpoints negotiate format by the `Content-Type` header. An API that normally takes JSON may *also* accept XML — and the moment it parses XML, XXE is on the table even though the JSON path looked safe:

```
Content-Type: application/json   ->  {"user": 1024}
Content-Type: application/xml    ->  <user>1024</user>   (now XML-parsed: try XXE)
```

Switching the content type is a one-header test that opens a whole different parser.

```question
id: content-type
prompt: A JSON endpoint also accepts a request when you switch the Content-Type to application/xml and send XML. Because the server now parses XML, which classic vulnerability from the Web Realm should you immediately test?
answer: XXE
accept: [xxe, xml external entity, xml external entities, external entity injection]
hint: Any XML parser you can reach is a candidate for external entities.
```

## Inventory is the whole game

The API security world has a name for this class of finding — **improper inventory management**: shadow endpoints, deprecated versions, staging APIs, undocumented hosts. The company does not know all its own doors, and the one it forgot is the one it did not defend.

```question
id: inventory
prompt: A company runs a documented v2 API but also has a forgotten v1, a staging API, and an undocumented internal host — none tracked. What is this whole class of "doors the company forgot it has" called in API security?
answer: improper inventory management
accept: [improper inventory management, improper assets management, inventory management, shadow apis, improper asset management]
hint: They lost track of their own inventory of APIs.
```

> One resource, many doors — and the forgotten ones are undefended. Try the version before the current, look for the SOAP service and its WSDL, switch the content type to reach another parser, and remember that the API a company forgot it runs is the one still holding last year's bug.
