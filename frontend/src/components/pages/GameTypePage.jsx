import { useSelector } from "react-redux";
import bgImg from "../../assets/images/Game-Play.png";
import userImg from '../../assets/images/User.png';
import createImg from "../../assets/images/Create.png";
import joinImg from "../../assets/images/Join.png";
import { useNavigate, useParams } from "react-router-dom";

const GameTypePage = () => {

const userData = useSelector((state) => state.auth.userData);
const navigate = useNavigate()
const { type } = useParams();

return (
    <div
        className="min-h-screen bg-cover bg-center relative"
        style={{ backgroundImage: `url(${bgImg})` }}
    >
      {/* Profile */}
        <div className="absolute top-4 left-4 flex items-center gap-3 bg-black/60 px-3 py-2 rounded-full text-white">
            <img src={userImg} alt="User" className="w-15 h-15 rounded-full" />
        <div>
            <h2 className="text-sm font-semibold">{userData?.name}</h2>
            <p className="text-xs">ID:{userData?._id}</p>
        </div>
    </div>

      {/* Game Options */}
      <div className="min-h-screen flex justify-center items-center bg-cover" style={{ backgroundImage: `url(${bgImg})` }}>
      <div className="grid grid-cols-2 gap-6 max-w-md">
        <button onClick={() => navigate(`/create-room/${type}`)} className="rounded-xl overflow-hidden shadow-lg hover:scale-105 transition">
          <img src={createImg} alt="Create" className="w-full" />
        </button>
        <button onClick={() => navigate(`/join-room/${type}`)} className="rounded-xl overflow-hidden shadow-lg hover:scale-105 transition">
          <img src={joinImg} alt="Join" className="w-full" />
        </button>
      </div>
    </div>
    </div>
);
};

export default GameTypePage;
