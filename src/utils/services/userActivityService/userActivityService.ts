import { ref, set } from "firebase/database"
import { database } from "../../../firebase/config"

export const updateUserActivity = async (userId: string) => {
  const today = new Date().toDateString()
  await set(ref(database, `userActivities/${today}/${userId}`), true)
}
