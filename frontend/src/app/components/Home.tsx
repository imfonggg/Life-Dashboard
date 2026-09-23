import Image from "next/image";
import backgroundImage from "../../img/background.jpg";

export const Home = () => {
  return (
    <Image
      src={backgroundImage}
      alt="Life Dashboard home"
      className="h-full min-h-screen w-full object-cover"
      priority
    />
  );
};
