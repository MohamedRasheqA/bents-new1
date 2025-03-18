import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export const useAuthRedirect = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  const handleStartChatting = () => {
    if (isLoaded) {
      if (isSignedIn) {
        router.push('/chat');
      } else {
        router.push('/sign-in');
      }
    }
  };

  return { handleStartChatting, isSignedIn, isLoaded };
}; 