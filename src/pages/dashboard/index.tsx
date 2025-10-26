import { useEffect, useState } from "react";
import {
  doc,
  onSnapshot,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { auth, db } from "@/firebase";
import { type User } from "firebase/auth";
import WheelCard, { type Wheel } from "@/components/WheelCard";
import ShareModal from "@/components/ShareModal";
import { Link } from "react-router-dom";

const Dashboard = ({ user }: { user: User | null }) => {
  const [isPublic, setIsPublic] = useState(false);
  const [wheels, setWheels] = useState<Wheel[]>([]);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedWheelId, setSelectedWheelId] = useState<string | null>(null);
  const [sharedWheels, setSharedWheels] = useState<Wheel[]>([]);

  useEffect(() => {
    if (user) {
      const userRef = doc(db, "users", user.uid);
      const unsubProfile = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          setIsPublic(doc.data().isPublic || false);
        }
      });

      const wheelsQuery = query(
        collection(db, "wheels"),
        where("owner", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const unsubWheels = onSnapshot(wheelsQuery, (snapshot) => {
        const userWheels = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Wheel)
        );
        setWheels(userWheels);
      });

      console.log(auth.currentUser?.email);

      const sharedWheelsQuery = query(
        collection(db, "wheels"),
        where("participants", "array-contains-any", [
          { email: auth.currentUser?.email, role: "viewer" },
          { email: auth.currentUser?.email, role: "editor" },
        ]),
        orderBy("createdAt", "desc")
      );

      console.log(sharedWheelsQuery);
      const unsubSharedWheels = onSnapshot(sharedWheelsQuery, (snapshot) => {
        const sharedWheels = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Wheel)
        );
        setSharedWheels(sharedWheels);
      });

      return () => {
        unsubProfile();
        unsubWheels();
        unsubSharedWheels();
      };
    }
  }, [user]);

  const handleOpenShareModal = (wheelId: string) => {
    setSelectedWheelId(wheelId);
    setShareModalOpen(true);
  };

  const handlePrivacyChange = async () => {
    if (user) {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { isPublic: !isPublic });
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p>Please log in to see your dashboard.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="px-4 py-3 bg-gray-50 rounded-xl mb-2">
          <p className="text-sm font-medium text-gray-900">
            {user.displayName || "User"}
          </p>
          <p className="text-xs text-gray-500 break-all mt-1">{user.email}</p>
        </div>
        <div className="flex items-center">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={handlePrivacyChange}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
              Profile is Public
            </span>
          </label>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-10">
        <div>
          <h2 className="text-2xl font-bold mb-4">My Wheels</h2>
          <div className="space-y-4">
            {wheels.length > 0 ? (
              wheels.map((wheel) => (
                <WheelCard
                  key={wheel.id}
                  wheel={wheel}
                  onShareClick={handleOpenShareModal}
                />
              ))
            ) : (
              <div className="bg-white p-6 rounded-2xl shadow-sm text-center">
                <p className="text-slate-600">
                  You haven't created any wheels yet.
                </p>
                <Link
                  to="/"
                  className="text-indigo-600 font-semibold hover:underline mt-2 inline-block"
                >
                  Create one now!
                </Link>
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">Shared with Me</h2>
          <div className="space-y-4">
            {sharedWheels.length > 0 ? (
              sharedWheels.map((wheel) => (
                <WheelCard key={wheel.id} wheel={wheel} />
              ))
            ) : (
              <div className="bg-white p-6 rounded-2xl shadow-sm text-center">
                <p className="text-slate-600">
                  No wheels have been shared with you yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      {shareModalOpen && selectedWheelId && (
        <ShareModal
          wheelId={selectedWheelId}
          onClose={() => setShareModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
