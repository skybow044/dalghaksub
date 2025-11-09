const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

export const nanoid = (size = 12) => {
  let id = '';
  const array = crypto.getRandomValues(new Uint32Array(size));
  for (let i = 0; i < size; i += 1) {
    id += alphabet[array[i] % alphabet.length];
  }
  return id;
};

export default nanoid;
