module flipper::repository;

use std::string::String;
use std::vector;
use sui::dynamic_field as df;
use flipper::utils::is_prefix;
use sui::address;

const EInvalidCap: u64 = 0;
const ENoAccess: u64 = 1;
const EDuplicate: u64 = 2;

const MARKER: u64 = 3;

const PERMISSION_READ: u64 = 0x01;
const PERMISSION_WRITE: u64 = 0x02;

// NONE
const DEFAULT_PERMISSIONS: u64 = 0x00;

// user -> group
//  + user -> permission
// blob_id -> MARKER

public struct Repository has key {
    id: UID,
    name: String,
}

public struct AdminCap has key {
    id: UID,
    repository_id: ID,
}

public fun create_repository(name: String, ctx: &mut TxContext): AdminCap {
    let repository = Repository {
        id: object::new(ctx),
        name: name,
    };
    let admin_cap = AdminCap {
        id: object::new(ctx),
        repository_id: object::id(&repository),
    };
    transfer::share_object(repository);
    admin_cap
}

entry fun create_repository_entry(name: String, ctx: &mut TxContext) {
    transfer::transfer(create_repository(name, ctx), ctx.sender());
}

// key format: [pkg id]::[repository id][random nonce]
public fun namespace(repository: &Repository): vector<u8> {
    repository.id.to_bytes()
}

fun approve_internal(caller: address, id: vector<u8>, repository: &Repository): bool {
    // Check if the id has the right prefix
    let namespace = namespace(repository);
    if (!is_prefix(namespace, id)) {
        return false;
    };

    let key = address::to_bytes(caller);
    vector::append(&mut key, id);

    let permissions: u64 = 0x00;
    if (df::exists_(&repository.id, key)) {
        permissions |= df::borrow(&repository.id, key);
    }

    permissions & PERMISSION_READ
}

entry fun seal_approve(id: vector<u8>, repository: &Repository, ctx: &TxContext) {
    assert!(approve_internal(ctx.sender(), id, repository), ENoAccess);
}

fun set_permissions(repository: &mut Repository, cap: &mut AdminCap, user_group: address, id: vector<u8>, permissions: u64) {
    assert!(cap.repository_id == object::id(repository), EInvalidCap);

    let key = address::to_bytes(user_group);
    vector::append(&mut key, id);

    df::add(&mut repository.id, key, permissions);
}
