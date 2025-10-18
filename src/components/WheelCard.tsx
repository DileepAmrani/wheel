import { useNavigate } from 'react-router-dom';

export interface Wheel {
  id: string;
  title: string;
  items: string[];
  isPublic: boolean;
  owner: string;
  createdAt: string;
}

interface WheelCardProps {
  wheel: Wheel;
  onShareClick?: (wheelId: string) => void;
}

function WheelCard({ wheel, onShareClick }: WheelCardProps) {
  const navigate = useNavigate();

  const viewWheel = () => {
    navigate(`/wheel/${wheel.id}`);
  };

  return (
    <div className="rounded-2xl bg-white/80 border border-slate-200 p-4 flex justify-between items-center">
      <div>
        <h3 className="font-semibold text-lg">{wheel.title}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          wheel.isPublic
            ? 'bg-blue-100 text-blue-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {wheel.isPublic ? 'Public' : 'Private'}
        </span>
      </div>
     <div className="flex gap-2">
       <button
        onClick={viewWheel}
        className="px-2 py-1 rounded-xl border bg-white hover:bg-slate-50 font-semibold"
      >
        View
      </button>
      {onShareClick && (  
      <button
        onClick={() => onShareClick?.(wheel.id)}
        className="px-2 py-1 rounded-xl border bg-white hover:bg-slate-50 font-semibold"
      >
        Share
      </button>
      )}
     </div>
    </div>
  );
}

export default WheelCard;