import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { usePostHog } from "@posthog/react";
import {
  UserPlus,
  UserCheck,
  UserX,
  Shield,
  Loader2,
  Check,
  X,
} from "lucide-react";
import { Pressable } from "../ui/Pressable";

type ConnectionStatus =
  | "none"
  | "pending"
  | "accepted"
  | "blocked"
  | "rejected";

type ActionType =
  | "send"
  | "accept"
  | "decline"
  | "block"
  | "unfollow";

interface InitStatus {
  status: ConnectionStatus;
  canConnect: boolean;
  targetUserId: string;
  direction: "incoming" | "outgoing" | null;
}

interface Props {
  targetUsername: string;
  targetUserId: string;
  initialStatus: InitStatus;
  isOwner: boolean;
  onStatusChange?: (newStatus: ConnectionStatus) => void;
}

export function ConnectButton({
  targetUserId,
  initialStatus,
  onStatusChange,
}: Props) {
  const fetcher = useFetcher();
  const posthog = usePostHog();

  const [status, setStatus] = useState<ConnectionStatus>(
    initialStatus.status
  );

  const [direction, setDirection] = useState<
    "incoming" | "outgoing" | null
  >(initialStatus.direction);

  const [showMenu, setShowMenu] = useState(false);

  const [loadingAction, setLoadingAction] =
    useState<ActionType | null>(null);

  const isLoading = (action: ActionType) =>
    loadingAction === action;

  const getNextStatus = (
    action: ActionType
  ): ConnectionStatus => {
    switch (action) {
      case "send":
        return "pending";

      case "accept":
        return "accepted";

      case "decline":
      case "unfollow":
        return "none";

      case "block":
        return "blocked";

      default:
        return status;
    }
  };

  const handleAction = (action: ActionType) => {
    const previousStatus = status;
    const nextStatus = getNextStatus(action);

    if (action === "send") {
      posthog?.capture("connection_request_sent", { target_user_id: targetUserId });
    } else if (action === "accept") {
      posthog?.capture("connection_accepted", { target_user_id: targetUserId });
    }

    setLoadingAction(action);

    // Optimistic update
    setStatus(nextStatus);

    if (action === "send") {
      setDirection("outgoing");
    }

    if (
      action === "accept" ||
      action === "decline" ||
      action === "unfollow"
    ) {
      setDirection(null);
    }

    setShowMenu(false);

    onStatusChange?.(nextStatus);

    fetcher.submit(
      { action, targetUserId },
      {
        method: "POST",
        action: "/api/connections/action",
      }
    );

    // rollback reference
    rollbackRef.current = {
      status: previousStatus,
      direction,
    };
  };

  const rollbackRef = {
    current: {
      status,
      direction,
    },
  };

  useEffect(() => {
    if (fetcher.state !== "idle") return;

    setLoadingAction(null);

    if (fetcher.data?.success) {
      if (fetcher.data.status) {
        setStatus(fetcher.data.status);
      }

      if (fetcher.data.direction !== undefined) {
        setDirection(fetcher.data.direction);
      }

      return;
    }

    // rollback on error
    if (fetcher.data?.success === false) {
      setStatus(rollbackRef.current.status);
      setDirection(rollbackRef.current.direction);
    }
  }, [fetcher.state, fetcher.data]);

  const baseButton =
    "flex-1 flex items-center gap-2 px-4 py-2 rounded-[4px] text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed";

  if (status === "blocked") {
    return (
      <Pressable
        disabled
        className={`${baseButton} bg-slate-200 text-slate-500`}
      >
        <Shield size={16} />
        Blocked
      </Pressable>
    );
  }

  if (status === "accepted") {
    return (
      <div className="relative">
        <Pressable
          onClick={() => setShowMenu((prev) => !prev)}
          className={`${baseButton} bg-green-100 text-green-700 border border-green-300 hover:bg-green-200`}
        >
          <UserCheck size={16} />
          Connected
        </Pressable>

        {showMenu && (
          <div className="absolute -right-8 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-10">
            <Pressable
              onClick={() => handleAction("unfollow")}
              disabled={isLoading("unfollow")}
              className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              {isLoading("unfollow") ? (
                <Loader2
                  size={14}
                  className="animate-spin"
                />
              ) : (
                <UserX size={14} />
              )}
              Unfollow
            </Pressable>

            <Pressable
              onClick={() => handleAction("block")}
              disabled={isLoading("block")}
              className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            >
              {isLoading("block") ? (
                <Loader2
                  size={14}
                  className="animate-spin"
                />
              ) : (
                <Shield size={14} />
              )}
              Block
            </Pressable>
          </div>
        )}
      </div>
    );
  }

  if (status === "pending") {
    if (direction === "outgoing") {
      return (
        <Pressable
          disabled={isLoading("decline")}
          onClick={() => handleAction("decline")}
          className={`${baseButton} bg-amber-100 text-amber-700 border border-amber-300 hover:bg-amber-200`}
        >
          {isLoading("decline") ? (
            <Loader2
              size={16}
              className="animate-spin"
            />
          ) : (
            <UserPlus size={16} />
          )}

          Request Sent
        </Pressable>
      );
    }

    if (direction === "incoming") {
      return (
        <div className="flex items-center gap-2">
          <Pressable
            disabled={loadingAction !== null}
            onClick={() => handleAction("accept")}
            className={`${baseButton} bg-green-100 text-green-700 border border-green-300 hover:bg-green-200`}
          >
            {isLoading("accept") ? (
              <Loader2
                size={16}
                className="animate-spin"
              />
            ) : (
              <Check size={16} />
            )}

            Accept
          </Pressable>

          <Pressable
            disabled={loadingAction !== null}
            onClick={() => handleAction("decline")}
            className={`${baseButton} bg-red-100 text-red-700 border border-red-300 hover:bg-red-200`}
          >
            {isLoading("decline") ? (
              <Loader2
                size={16}
                className="animate-spin"
              />
            ) : (
              <X size={16} />
            )}

            Decline
          </Pressable>
        </div>
      );
    }
  }

  if (!initialStatus.canConnect) {
    return (
      <Pressable
        disabled
        className={`${baseButton} bg-slate-100 text-slate-400`}
      >
        <UserPlus size={16} />
        Requests Disabled
      </Pressable>
    );
  }

  return (
    <Pressable
      onClick={() => handleAction("send")}
      disabled={isLoading("send")}
      className={`${baseButton} bg-primary text-white hover:bg-purple-700 active:scale-95 justify-center`}
    >
      {isLoading("send") ? (
        <Loader2
          size={16}
          className="animate-spin"
        />
      ) : (
        <UserPlus size={16} />
      )}

      Connect
    </Pressable>
  );
}