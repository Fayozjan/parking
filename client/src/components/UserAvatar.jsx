import { useEffect, useState } from "react";
import { User } from "lucide-react";

// Фото пользователя; если фото нет или оно не загрузилось — иконка пользователя
const UserAvatar = ({ user }) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [user?.photo]);

  if (user?.photo && !failed) {
    return (
      <img
        src={`/api/users/image/${user.photo}`}
        alt=""
        onError={() => setFailed(true)}
      />
    );
  }

  return <User size="55%" strokeWidth={2} aria-hidden="true" />;
};

export default UserAvatar;
