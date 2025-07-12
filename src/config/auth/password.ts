import crypto from 'crypto';

const STRING_ENCODING = 'base64';
const HASH_KEY_LENGTH = 64;

function generatePassword(password: string) {
  const salt = crypto.randomBytes(64).toString(STRING_ENCODING);
  const hash = crypto
    .scryptSync(password, salt, HASH_KEY_LENGTH)
    .toString(STRING_ENCODING);

  return {
    salt,
    hash,
  };
}

function isValidPassword(password: string, salt: string, hash: string) {
  return (
    crypto
      .scryptSync(password, salt, HASH_KEY_LENGTH)
      .toString(STRING_ENCODING) === hash
  );
}

export { generatePassword, isValidPassword };
