export type AppEvent =
  | { type: "LOGIN_TODAY"; dateKey: string }
  | { type: "PROFILE_COMPLETED" }
  | { type: "REFERRAL_SIGNUP" }
  | { type: "XP_EARNED"; amount: number }
  | { type: "WEEKLY_MISSION_COMPLETED" };