/*
 * Copyright (c) 2020 Oracle and/or its affiliates.
 *
 * Licensed under the Universal Permissive License v 1.0 as shown at
 * http://oss.oracle.com/licenses/upl.
 */

import { RemoteCache } from "./remote_cache";

/**
 * Map with concurrency features.
 * 
 * @param <K>  the type of the map entry keys.
 * @param <V>  the type of the map entry values.
 */
export interface ConcurrentMap<K = any, V = any>
  extends RemoteCache<K, V> {

  /**
   * Attempt to lock the specified item within the specified period of time.
   * <p>
   * The item doesn't have to exist to be <i>locked</i>. While the item is
   * locked there is known to be a <i>lock holder</i> which has an exclusive
   * right to modify (calling put and remove methods) that item.
   * <p>
   * Lock holder is an abstract concept that depends on the ConcurrentMap
   * implementation. For example, holder could be a cluster member or
   * a thread (or both).
   * <p>
   * Locking strategy may vary for concrete implementations as well. Lock
   * could have an expiration time (this lock is sometimes called a "lease")
   * or be held indefinitely (until the lock holder terminates).
   * <p>
   * Some implementations may allow the entire map to be locked. If the map is
   * locked in such a way, then only a lock holder is allowed to perform
   * any of the "put" or "remove" operations.
   * Pass the special constant {@link #LOCK_ALL} as the <i>oKey</i> parameter
   * to indicate the map lock.
   *
   * @param key   key being locked
   * @param cWait  the number of milliseconds to continue trying to obtain
   *               a lock; pass zero to return immediately; pass -1 to block
   *               the calling thread until the lock could be obtained
   *
   * @return true if the item was successfully locked within the
   *              specified time; false otherwise
   */
  lock(key: any, cWait?: number): boolean;

  /**
   * Unlock the specified item. The item doesn't have to exist to be
   * <i>unlocked</i>. If the item is currently locked, only
   * the <i>holder</i> of the lock could successfully unlock it.
   *
   * @param oKey key being unlocked
   *
   * @return true if the item was successfully unlocked; false otherwise
   */
  unlock(key: any): boolean;

}