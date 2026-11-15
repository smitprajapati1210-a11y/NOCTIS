export const PROFILE_NAME_LIMIT = 40;
export const PROFILE_PHOTO_LIMIT = 96_000;

export type ProfileDetails = {
  profileName: string;
  profilePhoto: string;
  phoneNumber: string;
};

export type ProfileAccount = Partial<ProfileDetails> & {
  email: string;
  updateProfile: (profile: ProfileDetails) => Promise<void>;
  signOut: () => Promise<void>;
};

export function validPhoneNumber(value: string): boolean {
  if (!value) return true;
  const count = value.replace(/\D/g, "").length;
  return /^\+?[\d ().-]+$/.test(value) && count >= 7 && count <= 15;
}
