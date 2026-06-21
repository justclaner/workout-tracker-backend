import bcrypt from "bcrypt";

export const hashString = async (string, saltRounds) => {
  try {
    const hashedString = await bcrypt.hash(string, saltRounds);
    return hashedString;
  } catch (e) {
    return undefined;
  }
};
