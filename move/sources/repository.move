#[allow(unused_const)]

module flipper::repository;

use std::string::String;
use sui::dynamic_field as df;
use flipper::utils::is_prefix;
use sui::address;

const EInvalidCap: u64 = 0;
const ENoAccess: u64 = 1;
const EDuplicate: u64 = 2;

const BLOB_MARKER: u64 = 0xFFFFFF;

const PERMISSION_READ: u64 = 0x01;
const PERMISSION_WRITE: u64 = 0x02;

// NONE
const DEFAULT_PERMISSIONS: u64 = 0x00;

// user -> user_group
// user / user_group + [pkg id]::[repository id][random nonce] -> permission
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
        return false
    };

    let mut key = address::to_bytes(caller);
    vector::append(&mut key, id);

    let mut permissions: u64 = 0x00;
    if (df::exists_(&repository.id, key)) {
        let user_permissions: u64 = *df::borrow(&repository.id, key);
        permissions = permissions | user_permissions;
    };

    if (df::exists_(&repository.id, caller)) {
        let user_groups: &vector<address> = df::borrow(&repository.id, caller);
        let mut i = 0;
        let len = vector::length(user_groups);

        // Iterate through all groups the user belongs to
        while (i < len) {
            let group = *vector::borrow(user_groups, i);
            let mut group_key = address::to_bytes(group);
            vector::append(&mut group_key, id);

            // If the group has permissions for this id, add them
            if (df::exists_(&repository.id, group_key)) {
                let group_permissions: u64 = *df::borrow(&repository.id, group_key);
                permissions = permissions | group_permissions;
            };

            i = i + 1;
        };
    };

    let read_access = permissions & PERMISSION_READ != 0;
    read_access
}

entry fun seal_approve(id: vector<u8>, repository: &Repository, ctx: &TxContext) {
    assert!(approve_internal(ctx.sender(), id, repository), ENoAccess);
}

public fun set_permissions(repository: &mut Repository, cap: &AdminCap, user_group: address, id: vector<u8>, permissions: u64) {
    assert!(cap.repository_id == object::id(repository), EInvalidCap);

    let mut key = address::to_bytes(user_group);
    vector::append(&mut key, id);

    df::add(&mut repository.id, key, permissions);
}

public fun publish(repository: &mut Repository, cap: &AdminCap, blob_id: String) {
    assert!(cap.repository_id == object::id(repository), EInvalidCap);
    df::add(&mut repository.id, blob_id, BLOB_MARKER);
}

public fun assign_user_to_group(repository: &mut Repository, cap: &AdminCap, user: address, user_group: address) {
    assert!(cap.repository_id == object::id(repository), EInvalidCap);

    // Initialize or get the user's groups
    if (!df::exists_(&repository.id, user)) {
        let new_groups = vector::empty<address>();
        df::add(&mut repository.id, user, new_groups);
    };

    let user_groups: &mut vector<address> = df::borrow_mut(&mut repository.id, user);

    // Check if user is already in the group
    let mut i = 0;
    let len = vector::length(user_groups);
    let mut already_in_group = false;

    while (i < len && !already_in_group) {
        if (*vector::borrow(user_groups, i) == user_group) {
            already_in_group = true;
        };
        i = i + 1;
    };

    // Add user to the group if not already a member
    if (!already_in_group) {
        vector::push_back(user_groups, user_group);
    };
}
