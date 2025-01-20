// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
  getDatabase,
  set,
  get,
  update,
  remove,
  query,
  orderByChild,
  equalTo,
  ref,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
const firebaseConfig = {
  apiKey: "AIzaSyBM1iccG2c8-yl5BrLpkhx_tl8UFLnkzYc",
  authDomain: "grade-master-riu-fyp.firebaseapp.com",
  databaseURL: "https://grade-master-riu-fyp-default-rtdb.firebaseio.com",
  projectId: "grade-master-riu-fyp",
  storageBucket: "grade-master-riu-fyp.appspot.com",
  messagingSenderId: "389633784942",
  appId: "1:389633784942:web:f3112504d1bd3a2623fa7f",
  measurementId: "G-V19XYLXY32",
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// Function to set data in Firebase
const setData = (path, data) => {
  return set(ref(db, path), data);
};

// Function to get data from Firebase
const getData = (path) => {
  return get(ref(db, path));
};

// Function to update data in Firebase
const updateData = (path, data) => {
  return update(ref(db, path), data);
};

// Function to remove data from Firebase
const removeData = (path) => {
  return remove(ref(db, path));
};
function randomID(length = 10) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

async function queryByKeyValue(nodePath, key1 = null, value1 = null, key2 = null, value2 = null, key3 = null, value3 = null) {
  try {
    const dbRef = ref(db, nodePath);
    let queryRef;

    if (key1 && value1) {
      queryRef = query(dbRef, orderByChild(key1), equalTo(value1));
    } else {
      queryRef = dbRef;
    }

    const snapshot = await get(queryRef);

    if (snapshot.exists()) {
      const data = snapshot.val();
      const rows = [];

      for (const [id, item] of Object.entries(data)) {
        let matchesKey2 = true;
        let matchesKey3 = true;

        if (key2 && value2) {
          matchesKey2 = item[key2] === value2;
        }

        if (key3 && value3) {
          matchesKey3 = item[key3] === value3;
        }

        if (matchesKey2 && matchesKey3) {
          item.id = id;
          rows.push(item);
        }
      }

      return rows;
    } else {
      console.log("No data available for the given query.");
      return [];
    }
  } catch (error) {
    console.error("Error querying data:", error);
    throw error;
  }
}

export {
  setData,
  getData,
  updateData,
  removeData,
  randomID,
  queryByKeyValue
};
