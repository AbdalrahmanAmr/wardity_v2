import { FC, ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PageLoadingSpinner } from "@/components/ui";

interface AdminRouteProps {
  children: ReactNode;
}

export const AdminRoute: FC<AdminRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (!user || user.role !== "admin") {
        navigate("/");
      }
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return <PageLoadingSpinner />;
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  return <>{children}</>;
};
