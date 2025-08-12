// components/common/AuthLoader.jsx
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, Outlet } from "react-router-dom";
import socketService from "../../socketService";
import { setUser, logoutUser } from "../../store/authSlice";

const AuthLoader = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restore = async () => {
      try {
        const user = localStorage.getItem("userData");
        if (user) {
          const parsedUser = JSON.parse(user);
          dispatch(setUser(parsedUser));
          await socketService.connect();

          const session = localStorage.getItem("gameSession");
          if (session) {
            const { roomId, type, isCreator } = JSON.parse(session);
            navigate(`/game-room/${type}/${roomId}`, { state: { isCreator } });
          }
        } else {
          dispatch(logoutUser());
        }
      } catch (err) {
        dispatch(logoutUser());
      } finally {
        setLoading(false);
      }
    };

    restore();
  }, [dispatch, navigate]);

  if (loading) return <div>Loading...</div>;

  return <Outlet />;
};

export default AuthLoader;
