---
slug: "climbing-the-keep"
title: "Climbing the Keep"
kingdom: "web"
place: "broken-gate"
order: 2
xp: 260
difficulty: 3
minutes: 35
requires: []
skills: ["idor"]
attributes: { exploitation: 2, logic: 2 }
summary: "Horizontal moves reach another user's data; vertical moves reach the admin's. The path up is usually a function the UI hid but the server still runs."
---

IDOR moved you sideways — to another user like you. **Privilege escalation** moves you up — to a role you were never given. Horizontal is reaching your neighbour's account; vertical is reaching the administrator's functions. The way up is almost always a capability the interface hid while the server left it running.

## Horizontal versus vertical

Keep the two straight, because they are reported differently. Reaching *another user at your own level* is horizontal (that is the IDOR family). Reaching *a higher level* — admin panels, other tenants' controls — is vertical.

```question
id: horiz-vert
prompt: As an ordinary user you reach a function only administrators should have. Is that horizontal privilege escalation (to a peer) or vertical (to a higher role)?
answer: vertical
accept: [vertical privilege escalation, vertical escalation, vertical priv esc]
hint: You moved up a level, not sideways to a peer.
```

## The function the UI only hid

A single-page app hides the admin buttons for non-admins — but the admin API routes are in the same bundle and still answer. You found `/admin/api/users` during recon; now you just call it with your ordinary token:

```http
POST /admin/api/users/1024/promote HTTP/1.1
Authorization: Bearer <ordinary user token>
```

If the server checks your token is valid but never checks it belongs to an admin, it promotes the account. This is **forced browsing** to a privileged function — the classic vertical escalation, and the reason a hunter tests the endpoint directly instead of trusting the missing button.

```question
id: forced-browsing
prompt: The admin button is hidden from your account, but calling POST /admin/api/users/1024/promote with your normal token succeeds because the server only checked the token was valid, not that you are an admin. What is reaching a hidden privileged endpoint directly called?
answer: forced browsing
accept: [forced browsing, function level authorization, missing function level access control, direct access to the endpoint, broken function level authorization]
hint: You browsed straight to the function the UI declined to show you.
```

## The role you set yourself

Some apps decide your role from a value *you* send. A profile update that quietly accepts a `role` field, or a registration that lets you post `"isAdmin": true`, hands you the keys:

```http
PATCH /api/v1/users/me HTTP/1.1

{"displayName": "alice", "role": "admin"}
```

If `role` is not on the allowed list of fields a user may set (this is **mass assignment**, and you meet it again in the API kingdom), the server writes it and you are admin. Always add the privileged field the UI never offered and see if the server takes it.

```question
id: role-set
prompt: A profile-update request normally sends only displayName, but you add a role field set to admin in the JSON and the server saves it, making you an admin. What should the server have done with a field a user is not allowed to set?
answer: ignore it
accept: [reject it, ignore the field, not accept it, strip it, whitelist allowed fields, refuse the extra field, drop it]
hint: The server should only accept the fields a user is permitted to change.
```

## The tenant next door

In multi-tenant apps (each company its own workspace), the prize is crossing into another **tenant**. The account id looked scoped, but an `X-Org-Id` header or an `org_id` in the body decides which company's data you see — change it to another org and, if the server trusts it, their whole workspace opens.

```question
id: tenant
prompt: A SaaS app scopes everything by an org_id you send in the request. Changing it to another company's org_id returns their data. What boundary did the server fail to enforce?
answer: tenant isolation
accept: [tenant isolation, multi-tenant isolation, org isolation, workspace isolation, the tenant boundary, cross-tenant access control]
hint: Each company's data should be sealed off from the others.
```

> Escalation is authorization's upward failure. The route up is a hidden-but-live admin endpoint, a role field the server should have ignored, or a tenant id it should not have trusted. Test the function directly, send the field the UI never offered, and swap the org id — the keep is usually easier to climb than to knock down.
