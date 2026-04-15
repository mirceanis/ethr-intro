<!-- .slide: class="title-slide" -->

# How `did:ethr` Works

A story-driven deep explainer.

`left / right`: move through the story  
`up / down`: go deeper into the current idea

---

# What's `ethr`?

`did:ethr` is a DID method that uses the **Ethereum blockchain** to update and resolve DIDs.

Ethereum is a global, shared, virtual machine.<br/>
Anyone can **read** the state of the machine (for free) and **write** to it (with some cost).<br/>
It uses programs called **smart contracts** to define rules for how state can be stored and updated.<br/>
Updates to the machine are made by transactions, which require a signature from a key pair and a fee called **gas
**.<br/>

--

# Transactions?

A transaction is a **signed message** that tells the Ethereum machine to **update its state** according to some rules.

- It has a sender (the signer) and a recipient (a smart contract or another account).
- It can include data (e.g. function calls and arguments) and a fee (gas).
- Once included in a **block**, it becomes part of the **immutable history** of the blockchain.

--

# Accounts?

There are two types of accounts on Ethereum:

* **Externally Owned Accounts (EOAs)**:
    - controlled by a private key
    - can sign and send transactions

* **Smart Contract Accounts**:
    - controlled by code
    - can execute logic when their functions are called by transactions
    - can call other contract functions

Both types of accounts have an _address_, in the same address space.

--

# Smart Contracts?

A smart contract is a **program** that lives on the Ethereum virtual machine.

It defines rules (functions) for how its state can be read or updated.

When a **transaction** calls a function on the contract, the contract executes its code and **updates** its state accordingly.

Smart contract functions can emit **events** that are recorded in the **transaction logs**.

Some functions can be read-only (view/pure) and do not require a transaction or gas to call.

Functions can **call other functions** within the same contract or in other contracts.

---

# Your wallet address is your DID

`did:ethr` lets an Ethereum account, or its corresponding public key act as
a [Decentralized Identifier](https://www.w3.org/TR/did-1.0/).

- Any Ethereum address or public key has an implicit DID Document, with itself as controller.
- This DID Document can be updated by the controller by sending transactions to
  a [ERC1056 registry contract](https://github.com/uport-project/ethr-did-registry/blob/master/contracts/EthereumDIDRegistry.sol).
- A resolver assembles a DID document from Ethereum state and history.
- The controller can rotate.

--

# Role of the Resolver

The resolver looks at the history of changes to figure out:

- if the DID has had any updates
- which updates are DID updates vs unrelated transactions
- which keys and service endpoints are currently valid
- which address is the current controller

--

## Subject vs Controller

- The DID subject is whatever the DID identifies
- The controller is whoever can change the DID state
- With `did:ethr` those start out aligned (like `did:key`, or `did:pkh`)
- **They do not have to stay aligned forever**

--

## Controller authority

By design, the controller address always appears in the DID Document with the suffix `#controller`.

* no supplementary transaction needed to add it as a verification method
* it is always present, even if the DID has no history of updates
* updates to the controller are reflected in the DID Document as changes to the `blockchainAccountId` of the `#controller` method

---

## Not a Profile Page!

The DID document is NOT meant to be a biography or claims bundle.

It mostly answers:

- which keys are valid
- which verification relationships they belong to
- which service endpoints are currently published

---

# Meet Our First `did:ethr`

We start with the simplest form, an address prefixed with `did:ethr:`:

[ `did:ethr:0x1234567890abcdef1234567890abcdef12345678`](https://dev.uniresolver.io/#did:ethr:0x1234567890abcdef1234567890abcdef12345678)

Read it as:

- DID scheme: `did`
- DID method: `ethr`
- method-specific identifier: `0x1234567890abcdef1234567890abcdef12345678` - an Ethereum address

--

## DID Document

For this particular DID, the resolver returns this DID document:

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

There is no "create DID" operation.

DIDs exist as soon as you can refer to them.

- If you control an Ethereum key pair, you can already refer to it as `did:ethr:...`.
- On-chain activity starts only when you want the DID to evolve.
- That means creation is private and has no upfront gas cost.

[Click here to resolve this imaginary DID:<br/>
`did:ethr:0x1234567890abcdef1234567890abcdef12345678`](https://dev.uniresolver.io/#did:ethr:0x1234567890abcdef1234567890abcdef12345678)

--

## What Exists Before Any Updates

Even with no registry history, resolution still returns a minimal DID document.

- It includes a `#controller` verification method.
- That method is referenced from `authentication` and `assertionMethod`.

--

## Why This Matters

- No registration ceremony
- No registry write just to exist
- First transaction only happens when control or metadata changes
- Infinitely scalable creation

---

# Role of the Registry

The Ethereum DID Registry is a smart contract that acts as a **shared source of truth** for DID state and history.

It provides a set of _functions_ and defines a set of _events_<br/>
that allow **DID controllers** to **publish updates**<br/>
and **resolvers** to construct the **DID document**.

```solidity
// simplified interface:

contract EthereumDIDRegistry {
    mapping(address => address) public owners;
    mapping(address => uint) public changed;

    function changeOwner(address identity, address newOwner) public;

    function identityOwner(address identity) public view returns (address);

    function setAttribute(address identity, bytes32 name, bytes value, uint validity) public;

    function revokeAttribute(address identity, bytes32 name, bytes value) public;

    event DIDOwnerChanged();
    event DIDAttributeChanged();
}
```

In terms of Object-Oriented Programming, you can think of the registry as a class instance<br/>
that defines the state and behavior of DIDs on a globally accessible virtual machine called Ethereum.

--

# How does an event look like?

When a DID controller successfully calls `changeOwner`, `setAttribute`, etc, the registry emits an event that looks like this:

```json5
{
  "event": "DIDOwnerChanged",                               // the type of change
  "identity": "0x1234567890abcdef1234567890abcdef12345678", // the DID subject
  "owner": "0xabcdef1234567890abcdef1234567890abcdef12",    // new controller address
  "previousChange": 42                                      // block number of the previous change for this subject
}
```

[Here](https://etherscan.io/tx/0xf436f2f55dd299f35e7ddb881d2499a02cc248a1346280b0202e783a5e4623bf#eventlog) is what a live event looks like on a block explorer.

--

# Why Events?

Events were chosen as the primary source of truth for DID updates because:
- They are **cheap to write** (emit) compared to storing data in contract state.
- They are **easily accessible** to resolvers via `getLogs`
- They provide a **linked history** through the `previousChange` field, enabling efficient resolution without scanning the entire chain.
- They allow for a **flexible data model**

---

# Resolver Walkthrough

The DID document is *NOT stored as a JSON file*.

The resolver builds it at resolve time by walking the identity history backward:

1. Ask the registry for the latest block where something `changed`.
2. Get the events at that block and find out what changed and where to look next (`previousChange`).
3. **Follow** each event's `previousChange` pointer backward, collecting events at every relevant block.
4. Once the **full history** is available, compute the active keys, and services.

```mermaid
flowchart LR
    A(["changed(identity)"]) -->|"latest block #"| B["getLogs(block)"]
    B -->|"parse events"| C{"previousChange<br/>== 0 ?"}
    C -->|no| B
    C -->|yes| D["Full history<br/>collected"]
    D --> F(["DID Document"])
```

--

## The Two Important Reads

* `changed(identity)` tells the resolver when the latest change happened (block number).
* `getLogs(identity, block)` lets the resolver read the relevant events at that block and find out
    * what changed
    * where to look next.

This avoids scanning the whole chain from genesis.

--

## The Event Walk

The resolver interprets three event families:

- `DIDOwnerChanged`
- `DIDDelegateChanged`
- `DIDAttributeChanged`

Each event has a `previousChange` field that points to the block number of the previous change.<br/>
The history is linked block-to-block through `previousChange`.

---

## Minimal DID Document

When `changed(0xAddress)` returns `0`,<br/>it means no updates have ever happened.

The resolver returns the **implicit DID document**:

```json
{
  "id": "did:ethr:0xAddress",
  "verificationMethod": [
    {
      "id": "did:ethr:0xAddress#controller",
      "type": "EcdsaSecp256k1RecoveryMethod2020",
      "controller": "did:ethr:0xAddress",
      "blockchainAccountId": "eip155:1:0xAddress"
    }
  ],
  "authentication": [
    "...#controller"
  ],
  "assertionMethod": [
    "...#controller"
  ]
}
```

--

# A DID with updates

Example DID with 2 updates at blocks 314 and 42:

```mermaid
flowchart LR
    start(["changed(identity)<br/>result: 314"]) -->|"getLogs(314)"| event2["parse event:<br/>previousChange: 42"]
    event2 -->|"getLogs(42)"| event1["parse event:<br/>previousChange: 0"]
    event2 --> e2type[/DIDOwnerChanged/]
    event1 -->|stop at 0| stop(["Full history collected<br/>Construct DID Document"])
    event1 --> e1type[/DIDAttributeChanged/]
```

--

# DID Document with updates

```json5
{
  "id": "did:ethr:0xAddress",
  "verificationMethod": [
    {
      "id": "did:ethr:0xAddress#controller",
      "type": "EcdsaSecp256k1RecoveryMethod2020",
      "controller": "did:ethr:0xAddress",
      "blockchainAccountId": "eip155:1:0xNewOwnerAddress" // <-- from DIDOwnerChanged at block 314
    },
    {
      "id": "did:ethr:0xAddress#delegate-1",
      "type": "EcdsaSecp256k1VerificationKey2019",
      "controller": "did:ethr:0xAddress",
      "publicKeyHex": "02abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890" // <-- from DIDAttributeChanged at block 42
    }
  ],
  "authentication": [
    "...#controller"
  ],
  "assertionMethod": [
    "...#controller",
    "did:ethr:0xAddress#delegate-1" // <-- from DIDAttributeChanged at block 42
  ]
}
```

---

# Try it out!

Enter a `did:ethr` below to resolve it live.
<div class="did-resolver-form">
  <input id="did-input" type="text" value="did:ethr:0xb9c5714089478a327f09197987f16f9e5d936e8a" onfocus="this.select()" />
  <button id="did-resolve-btn">Resolve</button>
</div>
<div id="result-container"></div>

Or chose one of the examples:

  <button class="did-example" data-did="did:ethr:0xb9c5714089478a327f09197987f16f9e5d936e8a">mainnet (no history)</button><br/>
  <button class="did-example" data-did="did:ethr:gno:0xEd4aBF0BbA69C63e2657CF94693CC4a9070896a2">gnosis chain (with history)</button><br/>
  <button class="did-example" data-did="did:ethr:0xdca7ef03e98e0dc2b855be647c39abe984fcf21b">mainnet (registry contract)</button><br/>

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

# `did:ethr` is network-scoped

So far we used the simplest style, which defaults to Ethereum mainnet.

Now we make the network explicit:

`did:ethr:sepolia:0x1234567890abcdef1234567890abcdef12345678`

That is a _different DID_, with different resolution history.
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
