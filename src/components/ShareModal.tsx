import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { toast } from "react-hot-toast";

interface Participant {
  email: string;
  role: "viewer" | "editor";
}

interface ShareModalProps {
  wheelId: string ;
  onClose: () => void;
}

function ShareModal({ wheelId, onClose }: ShareModalProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newParticipantEmail, setNewParticipantEmail] = useState("");
  const [newParticipantRole, setNewParticipantRole] =
    useState<"viewer" | "editor">("viewer");
  const [copied, setCopied] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const url = `${window.location.origin}/wheel/${wheelId}`;
  const btn =
    "px-3 py-2 text-center rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition text-sm font-medium";

  useEffect(() => {
    const fetchParticipants = async () => {
      const wheelRef = doc(db, "wheels", wheelId);
      const wheelSnap = await getDoc(wheelRef);
      if (wheelSnap.exists()) {
        const wheelData = wheelSnap.data();
        setParticipants(wheelData.participants || []);
        setIsAnonymous(wheelData.isAnonymous || false);
      }
    };
    fetchParticipants();
  }, [wheelId]);

  const addParticipant = () => {
    if (newParticipantEmail.trim() === "") {
      toast.error("Please enter an email.");
      return;
    }
    setParticipants([
      ...participants,
      { email: newParticipantEmail, role: newParticipantRole },
    ]);
    setNewParticipantEmail("");
  };

  const removeParticipant = (email: string) => {
    setParticipants(participants.filter((p) => p.email !== email));
  };

  const saveParticipants = async () => {
    try {
      const wheelRef = doc(db, "wheels", wheelId);
      await updateDoc(wheelRef, { participants });
      toast.success("Sharing settings saved!");
      onClose();
    } catch (error) {
      console.error("Error saving participants: ", error);
      toast.error("Failed to save sharing settings.");
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm grid place-items-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-3xl shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 border-b pb-3">
          <h3 className="font-bold text-2xl text-slate-800">Share this wheel</h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 text-2xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Add people - only show for authenticated wheels */}
        <div className="space-y-4">
          {!isAnonymous && (
            <>
              <div>
                <h4 className="font-semibold text-slate-700 mb-2 text-lg">
                  Add people
                </h4>
                <div className="flex flex-col md:flex-row gap-3">
                  <input
                    type="email"
                    value={newParticipantEmail}
                    onChange={(e) => setNewParticipantEmail(e.target.value)}
                    placeholder="person@example.com"
                    className="flex-1 px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-400"
                  />
                  <select
                    value={newParticipantRole}
                    onChange={(e) =>
                      setNewParticipantRole(e.target.value as "viewer" | "editor")
                    }
                    className="px-3 py-2.5 border rounded-xl"
                  >
                    <option value="viewer">Can view</option>
                    <option value="editor">Can edit</option>
                  </select>
                  <button
                    onClick={addParticipant}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Current participants */}
              <div>
                <h4 className="font-semibold text-slate-700 mb-2 text-lg">
                  People with access
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {participants.length === 0 && (
                    <p className="text-slate-500 text-sm">No participants yet.</p>
                  )}
                  {participants.map((p) => (
                    <div
                      key={p.email}
                      className="flex items-center justify-between border rounded-lg p-2.5"
                    >
                      <span className="font-medium text-slate-800">{p.email}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-500">{p.role}</span>
                        <button
                          onClick={() => removeParticipant(p.email)}
                          className="text-red-500 hover:underline text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          
          {isAnonymous && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-blue-800 text-sm">
                <strong>📌 Quick Share:</strong> This wheel can be viewed by anyone with the link. 
                To manage permissions and add specific people, please save the wheel to your account first.
              </p>
            </div>
          )}

          {/* Share links */}
          <div>
            <h4 className="font-semibold text-slate-700 mb-3 text-lg">
              Share link
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button className={btn} onClick={copy}>
                {copied ? "Copied ✓" : "Copy link"}
              </button>
              <a
                className={btn}
                target="_blank"
                rel="noreferrer"
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                  url
                )}`}
              >
                Facebook
              </a>
              <a
                className={btn}
                target="_blank"
                rel="noreferrer"
                href={`https://www.messenger.com/t/?link=${encodeURIComponent(
                  url
                )}`}
              >
                Messenger
              </a>
              <button className={btn} onClick={copy}>
                Instagram
              </button>
              <button className={btn} onClick={copy}>
                TikTok
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-end">
          {!isAnonymous ? (
            <button
              onClick={saveParticipants}
              className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
            >
              Save & Close
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl bg-slate-600 text-white font-semibold hover:bg-slate-700"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ShareModal;
