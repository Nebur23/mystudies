import type { Route } from "./+types/leaderboard";
import { useState } from "react";
import { getLeaderboardData, getTopThree } from "~/lib/leaderboard.server";
import { useLoaderData, useNavigate } from "react-router";
import { auth } from "~/lib/auth.server";
import type { StringifyOptions } from "querystring";
import { UserAvatar } from "~/components/user-avatar";

/**
 * React Router v7 Loader for leaderboard page
 * Fetches leaderboard data server-side
 */
export async function loader({ request }: Route.LoaderArgs) {
  // TODO: Integrate with your betterAuth setup
  // Example:
  // const session = await auth.api.getSession({ headers: request.headers });
  // if (!session?.user) return redirect("/login");
  // const userId = session.user.id;

  const session = await auth.api.getSession({headers:request.headers})
  
    const userId = session?.user.id

    


  const url = new URL(request.url);
  const filter = (url.searchParams.get("filter") || "allTime") as
    | "week"
    | "month"
    | "allTime";

  try {
    const [leaderboardStats, topThree] = await Promise.all([
      getLeaderboardData(userId as string, filter),
      getTopThree(filter),
    ]);

    return {
      leaderboardStats,
      topThree,
      currentFilter: filter,
      userId,
    };
  } catch (error) {
    console.error("Error loading leaderboard:", error);
    throw new Response("Failed to load leaderboard", { status: 500 });
  }
}

export default function Leaderboard() {
  const { leaderboardStats, topThree, currentFilter, userId } =
    useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const handleFilterChange = (newFilter: "week" | "month" | "allTime") => {
    navigate(`?filter=${newFilter}`);
  };

  const rankings =
    currentFilter === "week"
      ? leaderboardStats.week
      : currentFilter === "month"
        ? leaderboardStats.month
        : leaderboardStats.allTime;

        console.log("rankings:", rankings);
        console.log("leaderboardStats:", leaderboardStats);
        console.log("topThree:", topThree);
        console.log("currentFilter:", currentFilter);
        console.log("userId:", userId);

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-0 py-8">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
        <div className="flex items-center gap-3">
          <div className="rounded-md  p-3 shadow-lg">
            <span
              className="material-symbols-outlined text-black text-xl "
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              leaderboard
            </span>
          </div>
          <div>
            <h2 className="font-h2 md:text-lg text-[30px] text-primary font-black leading-none">
              Leaderboard
            </h2>
            <p className="font-metadata text-metadata text-xs text-outline mt-1 uppercase tracking-widest">
              Academic Excellence
            </p>
          </div>
        </div>

        {/* Segmented Control Filter */}
        <div className="bg-gray-200 p-1 border rounded-[10px] flex items-center shadow-inner">
          {(
            [
              { value: "week", label: "This Week" },
              { value: "month", label: "This Month" },
              { value: "allTime", label: "All Time" },
            ] as const
          ).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleFilterChange(value)}
              className={`px-6 py-2 rounded-[10px] text-sm font-medium transition-all ${
                currentFilter === value
                  ? "bg-white text-primary shadow-sm font-semibold"
                  : "text-on-surface-variant hover:text-primary"
              }`}
              aria-pressed={currentFilter === value}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Winners Podium */}
      <div className="relative flex justify-center items-end gap-2 md:gap-8 mb-12 podium-gradient p-6 rounded-[10px] ">
        {topThree.map((member: any) => (
          <PodiumPosition
            key={member.position}
            member={member}
            isFirst={member.position === 1}
          />
        ))}
      </div>

      {/* Ranking List */}
      <div className="bg-white rounded-3xl shadow-sm border border-outline-variant overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-surface-container flex justify-between items-center bg-surface-container-low">
          <span className="font-label-bold text-on-surface-variant uppercase tracking-wider">
            Student Rankings
          </span>
          <span className="font-label-bold text-on-surface-variant uppercase tracking-wider">
            Score &amp; Mastery
          </span>
        </div>

        {/* Rankings */}
        {rankings.map((member:any) => (
          <RankingItem key={member.userId} member={member} />
        ))}

        {/* Spacer */}
        <div className="py-4 flex justify-center bg-slate-50/50">
          <div className="flex flex-col items-center gap-1">
            <div className="w-1 h-1 rounded-full bg-slate-300"></div>
            <div className="w-1 h-1 rounded-full bg-slate-300"></div>
            <div className="w-1 h-1 rounded-full bg-slate-300"></div>
          </div>
        </div>

        {/* Current User Row */}
        {leaderboardStats.userRank && (
          <div className="flex items-center justify-between px-6 py-5 bg-orange-50 border-y-2 border-orange-200">
            <div className="flex items-center gap-4">
              <span className="font-h3 text-body-md text-orange-700 font-black w-10 text-center">
                #{leaderboardStats.userRank.rank}
              </span>
              <div className="relative">
                <UserAvatar />
                <div className="absolute -bottom-1 -right-1 bg-secondary w-5 h-5 rounded-full border-2 border-white flex items-center justify-center">
                  <span
                    className="material-symbols-outlined text-[10px] text-white"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check
                  </span>
                </div>
              </div>
              <div>
                <p className="font-label-bold text-indigo-900">You</p>
                <p className="font-metadata text-metadata text-on-tertiary-fixed-variant">
                  Top{" "}
                  {rankings.length > 0 ? Math.round(
                    (leaderboardStats.userRank.rank / rankings.length) * 100
                  ) : 0 }
                  %
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-h3 text-body-lg font-black text-orange-600">
                {leaderboardStats.userRank.totalPoints}
              </p>
              <p className="font-metadata text-metadata text-orange-700 uppercase font-bold">
                Total Points
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Call to Action */}
      <div className="bg-primary text-white p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
        <div className="z-10">
          <h3 className="font-h3 text-body-lg text-white">
            Ready to climb the ranks?
          </h3>
          <p className="text-indigo-100 text-sm mt-1">
            Complete a practice session now to earn points.
          </p>
        </div>
        <a
          href="/pratice"
          className="bg-tertiary-fixed-dim text-tertiary font-bold px-8 py-3 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg whitespace-nowrap z-10 inline-block"
        >
          Start Practice Quiz
        </a>
      </div>
    </div>
  );
}

interface PodiumPositionProps {
  member: {
    position: 1 | 2 | 3;
    name: string;
    image: string | null;
    points: number;
  };
  isFirst?: boolean;
}

function PodiumPosition({ member, isFirst }: PodiumPositionProps) {
  const medalColors = {
    1: { badge: "bg-orange-400", bar: "bg-purple-500", height: "h-24 md:h-36" },
    2: { badge: "bg-slate-300", bar: "bg-slate-100/50", height: "h-16 md:h-24" },
    3: { badge: "bg-orange-800", bar: "bg-orange-100/50", height: "h-12 md:h-20" },
  };

  const colors = medalColors[member.position];
  const badgeTextColor =
    member.position === 3
      ? "text-white"
      : member.position === 2
        ? "text-slate-700"
        : "text-white";

  return (
    <div
      className={`flex flex-col items-center group w-1/3 max-w-[140px] ${
        isFirst ? "-translate-y-4 max-w-[180px]" : ""
      }`}
    >
      <div className="relative mb-3">
        {isFirst && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-tertiary-container animate-bounce">
            <span
              className="material-symbols-outlined text-4xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              military_tech
            </span>
          </div>
        )}
        <div
          className={`absolute -top-2 -right-2 ${colors.badge} ${
            isFirst ? "w-10 h-10" : "w-8 h-8"
          } rounded-full flex items-center justify-center border-2 border-white shadow-md z-10`}
        >
          <span
            className={`${isFirst ? "text-sm font-black" : "text-xs font-bold"} ${badgeTextColor}`}
          >
            {member.position}
          </span>
        </div>
        <img
          alt={`${member.name} - Rank ${member.position}`}
          className={`${
            isFirst
              ? "w-24 h-24 md:w-32 md:h-32 border-orange-300 shadow-xl"
              : "w-16 h-16 md:w-24 md:h-24"
          } rounded-full border-4 ${
            isFirst
              ? "border-orange-300"
              : member.position === 2
                ? "border-slate-200"
                : "border-orange-700/30"
          } object-cover shadow-lg group-hover:scale-105 transition-transform`}
          src={member.image || "https://github.com/shadcn.png"}
        />
      </div>
      <p
        className={`${
          isFirst ? "font-h3 text-body-lg font-bold" : "font-label-bold text-label-bold"
        } text-center truncate w-full`}
      >
        {member.name}
      </p>
      <p
        className={`${
          isFirst
            ? "font-body-md text-orange-600 font-extrabold"
            : "font-metadata text-metadata text-secondary font-bold"
        }`}
      >
        {member.points.toLocaleString()} pts
      </p>
      <div
        className={`${colors.height} w-full ${colors.bar} rounded-t-[10px] mt-4 border-t-2 ${
          member.position === 3 ? "border-orange-200" : "border-slate-200"
        } ${isFirst ? "shadow-2xl" : ""} relative overflow-hidden`}
      >
        {isFirst && (
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_0%,#fff,transparent)]"></div>
        )}
      </div>
    </div>
  );
}

interface RankingItemProps {
  member: {
    rank: number;
    userId: string;
    name: string;
    email: string;
    image: string | null;
    totalPoints: number;
    averageScore: number;
    quizzesCompleted: number;
  };
}

function RankingItem({ member }: RankingItemProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors border-b border-gray-100">
      <div className="flex items-center gap-4">
        <span className="font-h3 text-body-md text-outline w-6 text-center">
          {member.rank}
        </span>
        <img
          className="w-10 h-10 rounded-full object-cover"
          alt={`${member.name} profile`}
          src={member.image || "https://github.com/shadcn.png"}
        />
        <div>
          <p className="font-label-bold text-on-surface">{member.name}</p>
          <p className="font-metadata text-metadata text-on-surface-variant">
            {member.quizzesCompleted} quiz{member.quizzesCompleted !== 1 ? "zes" : ""}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-body-md font-bold text-primary">
          {member.totalPoints}
        </p>
        <p className="font-metadata text-metadata text-outline">pts</p>
      </div>
    </div>
  );
}