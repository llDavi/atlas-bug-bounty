---
slug: "files-the-server-trusts"
title: "Files the Server Trusts"
kingdom: "web"
place: "stonewatch"
order: 3
xp: 300
difficulty: 4
minutes: 40
requires: []
skills: ["ssrf", "deserialisation"]
attributes: { exploitation: 3, logic: 1 }
summary: "A path you can climb, an upload the server will run, an XML parser that reads local files, and bytes the app rebuilds into objects — four ways the server trusts input it should not."
---

The server reads files and rebuilds data all day, and it trusts the names and bytes you give it far too much. A filename with `..` in it, an upload the server later executes, an XML document that reads local files, a blob the app turns back into a live object — each is a place where "just data" becomes a way in.

## Climbing out of the folder

An app that builds a file path from your input — `download?file=report.pdf` becoming `/var/data/report.pdf` — lets you climb out with `..`:

```
?file=../../../../etc/passwd
->  root:x:0:0:root:/root:/bin/bash
    ...
```

This is **path traversal**. When the file read is then *included and executed* (PHP `include($_GET['page'])`), it becomes **Local File Inclusion**, and reading a log or an uploaded file you planted turns it into code execution. Filters that strip `../` are beaten with encodings like `..%2f` or `....//`.

```question
id: traversal
prompt: A download feature builds a path from your file parameter, and file=../../../../etc/passwd returns the system password file. What is this vulnerability called?
answer: path traversal
accept: [path traversal, directory traversal, lfi, local file inclusion]
hint: You traverse up and out of the intended directory with ".." segments.
```

## The upload the server runs

An avatar upload becomes critical when the server stores the file somewhere it will *execute* it and does not check what it really is. Upload `shell.php` and browse to it, and you have a web shell. Apps "validate" by the `Content-Type` header or the extension, both of which you control:

```
Content-Type: image/png      (you set this; the bytes are PHP)
filename="shell.php.png"      (double extension; some servers run the .php)
filename="shell.php%00.png"   (null byte truncates to .php on old stacks)
```

The questions to ask every upload: what type does it *really* check, and where does the file land — under the web root, executable?

```question
id: upload
prompt: An avatar upload only checks the Content-Type header, which the client sets. You upload a PHP web shell with Content-Type image/png and reach it in the browser. Why did the check fail to stop you?
answer: the client controls the content-type
accept: [content-type is client-controlled, you set the content-type, it trusts a client header, the header is attacker-controlled, it did not check the real bytes, client controls it]
hint: The header the server trusted is one you write yourself.
```

## The parser that reads your files for you

XML parsers can be told to pull in external entities. If an endpoint accepts XML and the parser is not hardened, **XXE** makes it read local files or make requests for you (SSRF again):

```xml
<!DOCTYPE foo [ <!ENTITY xxe SYSTEM "file:///etc/passwd"> ]>
<foo>&xxe;</foo>
```

The parser resolves `&xxe;` by reading the file and echoing it back. Anywhere XML goes in — SOAP, SAML, a `.docx`, an SVG upload — XXE may be waiting.

```question
id: xxe
prompt: An endpoint parses XML, and defining an external entity that points at file:///etc/passwd causes the parser to read that file and return its contents. What is this vulnerability called?
answer: XXE
accept: [xxe, xml external entity, xml external entities, external entity injection]
hint: You inject an external entity into the XML.
```

## The bytes rebuilt into an object

When an app takes serialised data — a Java blob starting `rO0AB`, a PHP string like `O:4:"User":...`, a Python pickle — and rebuilds it into an object without checking it, **insecure deserialization** lets you craft a blob that runs code during reconstruction. You rarely need to write the chain by hand; tools like `ysoserial` generate a payload for the library in use.

```question
id: deser
prompt: An app stores your session as a base64 Java object beginning rO0AB and rebuilds it on every request without validation. Feeding it a crafted object that executes code as it is reconstructed is which vulnerability class?
answer: insecure deserialization
accept: [insecure deserialization, deserialization, deserialisation, object injection, unsafe deserialization]
hint: The app deserialises attacker-controlled bytes back into a live object.
```

> The server trusts names and bytes it should treat as hostile: a path it lets you climb, an upload it will run, an XML document that reads its disk, a blob it rebuilds into an object. Each begins as "just a file" and ends, often, as code running on the box.
