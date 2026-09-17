"""The fixed vocabulary of the realm, shared by hunters and quests.

Alignments are the classes a hunter picks for themselves when signing the
register — purely an identity, so all nine are playable. Kingdoms are the
paths a bug bounty hunter can take; a hunter may follow several at once.
"""

ALIGNMENTS = (
    "lawful-good",
    "neutral-good",
    "chaotic-good",
    "lawful-neutral",
    "true-neutral",
    "chaotic-neutral",
    "lawful-evil",
    "neutral-evil",
    "chaotic-evil",
)

# Five kingdoms, one for each kind of ground real bug bounty programmes put in
# scope (tallied from Bugcrowd, Immunefi, Intigriti and YesWeHack scopes).
KINGDOMS = ("web", "api", "mobile", "smart-contracts", "networks")

# The six attributes on the character sheet. Each quest says which it trains
# and by how much; the sheet sums them over the quests discharged.
ATTRIBUTES = ("recon", "exploitation", "logic", "patience", "reporting", "restraint")

# Disciplines — what a quest teaches. The one a hunter has practised most
# gives them their subclass.
DISCIPLINES = (
    "http",
    "recon",
    "auth",
    "xss",
    "idor",
    "csrf",
    "open-redirect",
    "ssrf",
    "sqli",
    "logic",
    "deserialisation",
)

