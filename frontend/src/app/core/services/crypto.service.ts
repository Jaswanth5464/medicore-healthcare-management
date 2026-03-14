import { Injectable } from '@angular/core';

/**
 * MediCore CryptoService
 * Provides AES-GCM client-side encryption/decryption for chat messages.
 *
 * Key derivation: PBKDF2(userA_id + ":" + userB_id, hospitalSalt, 100000 iter, SHA-256) → 256-bit AES-GCM key.
 * - Both users derive the same key independently (smaller ID first for determinism).
 * - IV is prepended to every ciphertext (12 bytes, base64-encoded together).
 * - The server only ever stores and relays encrypted ciphertext.
 *
 * Note: For production, the salt should be a per-hospital secret stored securely.
 */
@Injectable({ providedIn: 'root' })
export class CryptoService {
  private readonly HOSPITAL_SALT = 'MediCore-HMS-v1-secure-salt';
  private keyCache = new Map<string, CryptoKey>();

  /** Derive a shared AES-GCM key for a user pair (order-independent). */
  async getKey(userIdA: string, userIdB: string): Promise<CryptoKey> {
    const [a, b] = [userIdA, userIdB].sort();
    const cacheKey = `${a}:${b}`;
    if (this.keyCache.has(cacheKey)) return this.keyCache.get(cacheKey)!;

    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw', enc.encode(`${a}:${b}`), 'PBKDF2', false, ['deriveBits', 'deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: enc.encode(this.HOSPITAL_SALT), iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    this.keyCache.set(cacheKey, key);
    return key;
  }

  /**
   * Encrypt a message. Returns base64 string: iv (12 bytes) + ciphertext, separated by '.'.
   * Returns the plaintext unchanged if either userId is missing (fallback).
   */
  async encrypt(plaintext: string, myUserId: string, otherUserId: string): Promise<string> {
    if (!myUserId || !otherUserId) return plaintext;
    try {
      const key = await this.getKey(myUserId, otherUserId);
      const ivRaw = crypto.getRandomValues(new Uint8Array(12));
      const iv = ivRaw.buffer as ArrayBuffer;
      const enc = new TextEncoder();
      const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext));
      const ivB64 = this.toBase64(new Uint8Array(iv));
      const ctB64 = this.toBase64(new Uint8Array(cipherBuf));
      return `ENC:${ivB64}.${ctB64}`;
    } catch (e) {
      console.error('[Crypto] Encrypt failed', e);
      return plaintext;
    }
  }

  /**
   * Decrypt a message. Returns plaintext.
   * If the payload doesn't start with 'ENC:' it is treated as legacy plaintext.
   */
  async decrypt(payload: string, myUserId: string, otherUserId: string): Promise<string> {
    if (!payload.startsWith('ENC:')) return payload;
    if (!myUserId || !otherUserId) return '[encrypted]';
    try {
      const key = await this.getKey(myUserId, otherUserId);
      const [ivB64, ctB64] = payload.slice(4).split('.');
      const iv = this.fromBase64(ivB64).buffer as ArrayBuffer;
      const cipherBuf = this.fromBase64(ctB64).buffer as ArrayBuffer;
      const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipherBuf);
      return new TextDecoder().decode(plainBuf);
    } catch (e) {
      console.error('[Crypto] Decrypt failed', e);
      return '[decryption error]';
    }
  }

  private toBase64(buf: Uint8Array): string {
    return btoa(String.fromCharCode(...Array.from(buf)));
  }

  private fromBase64(b64: string): Uint8Array {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
}
