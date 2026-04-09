<!-- .slide: class="title-slide" -->
# How `did:ethr` Works

A story-driven deep explainer.

`left / right`: move through the story  
`up / down`: go deeper into the current idea

---

# Your wallet address is your DID

`did:ethr` lets an Ethereum account, or its corresponding public key act as a decentralized identifier.

- Any Ethereum address or public key has an implicit DID Document, with itself as controller.
- This DID Document can be updated by the address it initially identifies.
- A resolver assembles a DID document from Ethereum state and history.
- The controller can rotate.

--

# Your wallet address is your DID

The resolver looks at the history of on-chain events to figure out:

- if the DID has had any updates
- which updates are DID updates vs unrelated transactions
- which keys and service endpoints are currently valid
- which address is the current controller

--

## Subject vs Controller

- The DID subject is whatever the DID identifies
- The controller is whoever can change the DID state
- With `did:ethr` those start out aligned
- They do not have to stay aligned forever

---

## Not a Profile Page

The DID document is not meant to be a biography or claims bundle.

It mostly answers:

- which keys are valid
- which verification relationships they belong to
- which service endpoints are currently published

---

# Meet Our First `did:ethr`

We start with the simplest form.

[`did:ethr:0x1234567890abcdef1234567890abcdef12345678`](https://dev.uniresolver.io/#did:ethr:0x1234567890abcdef1234567890abcdef12345678)

Read it as:

- DID scheme: `did`
- method: `ethr`
- method-specific identifier: `0x1234567890abcdef1234567890abcdef12345678`

--

## DID Document

The resolver builds a DID document for this identifier:

```json
{
  "id": "did:ethr:0x1234567890abcdef1234567890abcdef12345678",
  "verificationMethod": [
    {
      "id": "did:ethr:0x1234567890abcdef1234567890abcdef12345678#controller",
      "type": "EcdsaSecp256k1RecoveryMethod2020",
      "controller": "did:ethr:0x1234567890abcdef1234567890abcdef12345678",
      "blockchainAccountId": "eip155:1:0x1234567890AbcdEF1234567890aBcdef12345678"
    }
  ],
  "authentication": [
    "did:ethr:0x1234567890abcdef1234567890abcdef12345678#controller"
  ],
  "assertionMethod": [
    "did:ethr:0x1234567890abcdef1234567890abcdef12345678#controller"
  ]
}
```

---

# Creation Without Registration

There is no separate "create DID" transaction.

- If you control an Ethereum key pair, you can already refer to it as `did:ethr:...`.
- On-chain activity starts only when you want the DID to evolve.
- That means creation is private and has no upfront gas cost.

[Click here to resolve this imaginary DID: `did:ethr:0x1234567890abcdef1234567890abcdef12345678`](https://dev.uniresolver.io/#did:ethr:0x1234567890abcdef1234567890abcdef12345678)

--

## What Exists Before Any Updates

Even with no registry history, resolution still returns a minimal DID document.

- It includes a `#controller` verification method.
- That method is referenced from `authentication`.
- It is also referenced from `assertionMethod`.

--

## Why This Matters

- No registration ceremony
- No registry write just to exist
- First transaction only happens when control or metadata changes
- Infinitely scalable creation

---

# What the Resolver Returns

The DID document is *NOT stored as a JSON file*.

The resolver builds it at resolve time:
- read current owner
- read the latest change point
- walk backward through linked events
- interpret the active state from this history of events

--

## Minimal DID Document

```json
{
  "id": "did:ethr:0x1234567890abcdef1234567890abcdef12345678",
  "verificationMethod": [
    {
      "id": "did:ethr:0x1234567890abcdef1234567890abcdef12345678#controller",
      "type": "EcdsaSecp256k1RecoveryMethod2020",
      "controller": "did:ethr:0x1234567890abcdef1234567890abcdef12345678",
      "blockchainAccountId": "eip155:1:0x1234567890abcdef1234567890abcdef12345678"
    }
  ],
  "authentication": ["...#controller"],
  "assertionMethod": ["...#controller"]
}
```

---

# How the DID Document Is Reconstructed

At a high level, the resolver does this:

1. Ask the registry for the current controller.
2. Ask the registry for the latest block where something changed.
3. Follow each event's `previousChange` pointer backward.
4. Rebuild the active keys, delegates, and services.

--

## The Two Important Reads

`identityOwner(identity)` tells the resolver who currently controls the DID.

`changed(identity)` tells the resolver where the latest change happened.

That keeps resolution from scanning the whole chain from genesis.

--

## The Event Walk

The resolver interprets three event families:

- `DIDOwnerChanged`
- `DIDDelegateChanged`
- `DIDAttributeChanged`

The history is linked block-to-block through `previousChange`.

---

# What Can Change Over Time

`did:ethr` is simple when untouched.

It gets interesting once the DID evolves.

- control can move to a new owner
- extra keys can appear or get revoked
- service endpoints can be published or removed

--

## Controller Changes

By default, the identifier controls itself.

Later, control can move somewhere else:

- another externally owned account (a key pair)
- a smart contract
- a proxy, multisig, delegator, or any other flexible control model

---

# `did:ethr` is Network-Scoped

So far we used the simplest style, which defaults to Ethereum mainnet.

Now we make the network explicit:

`did:ethr:sepolia:0x1234567890abcdef1234567890abcdef12345678`

That is a different DID context, with different resolution history.
Effectively an independent DID that happens to share most of method-specific identifier.

--

## Why Network Scope Matters

- The same address can exist on many EVM networks.
- `did:ethr` needs a way to say which registry and chain to use.
- Network scope changes which events and state count during resolution.
- Different networks have different costs and security properties.  

---

# Tradeoffs

`did:ethr` gets a lot from Ethereum:

- self-management
- auditability
- flexible control models
- composability with other on-chain control models

But it also inherits some tradeoffs:

- public history
- resolver dependence on RPC access
- gas costs when updates happen

--