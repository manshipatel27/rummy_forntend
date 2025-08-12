import { useSelector } from "react-redux";
import bgImg from "../../assets/images/Game-Play.png";
import pointImg from "../../assets/images/Point-Play.png";
import poolImg from "../../assets/images/Pool-Play.png";
import userImg from '../../assets/images/User.png'
// import socketService from "../socketService";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
// import { useDispatch } from "react-redux";
// import { setGameType, setRoomData } from "../store/gameSlice";
// import toast from "react-hot-toast";

const HomePage = () => {

  const userData = useSelector((state) => state.auth.userData);
  const navigate = useNavigate()
  
  const handleSelect = (type) => {
    navigate(`/game-type/${type}`)
  }



  return (
    <div
      className="min-h-screen bg-cover bg-center relative"
      style={{ backgroundImage: `url(${bgImg})` }}
    >
      {/* Profile
      <div className="absolute top-4 left-4 flex items-center gap-3 bg-black/60 px-3 py-2 rounded-full text-white">
        <img src={userImg} alt="User" className="w-15 h-15 rounded-full" />
        <div>
          <h2 className="text-sm font-semibold">{userData?.name}</h2>
          <p className="text-xs">ID:{userData?._id}</p>
        </div>
      </div> */}

        <Header />

      {/* Game Options */}
      <div className="flex justify-center items-center h-screen">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-4 w-full max-w-2xl">
          <button
            onClick={() => handleSelect("point")}
            className="rounded-xl overflow-hidden shadow-lg hover:scale-105 transition"
          >
            <img src={pointImg} alt="Point" className="w-full" />
          </button>
          <button
            onClick={() => handleSelect("pool")}
            className="rounded-xl overflow-hidden shadow-lg hover:scale-105 transition"
          >
            <img src={poolImg} alt="Pool" className="w-full" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
