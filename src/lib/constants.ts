

export const DRIVE_TYPE_OPTIONS = [
  "On-Campus",
  "Off-Campus",
];

export const TYPE_OPTIONS = [
  "Intern",
  "Intern + FTE",
  "Intern + PPO",
  "FTE",
  "Hackathon",
];

export const STATUS_OPTIONS = [
  "Not Applied",
  "Applied",
  "Not Shortlisted",
  "Shortlisted",
  "PPT",
  "OA",
  "OA not clear",
  "GD",
  "Communication",
  "Technical round",
  "Interview",
  "Offer",
  "Rejected",
];


export const getStatusColor = (status: string) => {
    switch (status) {
      case "Not Applied":
        return "bg-yellow-700/20 text-gray-300 border-gray-700/30"
      case "Applied":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "Shortlisted":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30"
      case "Not Shortlisted":
        return "bg-red-300/20 text-orange-400 border-orange-500/30"
      case "PPT":
        return "bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
      case "OA":
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
      case "OA not clear":
        return "bg-red-200/20 text-red-400 border-red-500/30"
      case "GD":
        return "bg-pink-500/20 text-pink-400 border-pink-500/30"
      case "Communication":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "Technical round":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30"
      case "Interview":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "Offer":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "Rejected":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }
