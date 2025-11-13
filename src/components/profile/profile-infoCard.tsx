import { Bell, Sparkles } from 'lucide-react'
import React from 'react'

function ProfileInfoCard() {
      return (
            <div className="mt-8 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-blue-500/20 rounded-2xl p-6">
                  <div className="flex items-start space-x-4">
                        <div className="p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl">
                              <Bell className="h-6 w-6 text-blue-400" />
                        </div>
                        <div className="flex-1">
                              <h4 className="text-blue-400 font-semibold text-lg mb-2 flex items-center gap-2">
                                    Smart Deadline Reminders
                                    <Sparkles className="h-4 w-4 text-yellow-400 animate-pulse" />
                              </h4>
                              <p className="text-gray-300 leading-relaxed">
                                    Receive automated reminders about upcoming application deadlines.
                                    You'll get notifications 4 hours, 3 hours, and 2 hours before each deadline to ensure you never miss an opportunity.
                              </p>
                              <div className="mt-4 flex flex-wrap gap-2">
                                    <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm border border-purple-500/30">
                                          Email Notifications
                                    </span>
                              </div>
                        </div>
                  </div>
            </div>
      )
}

export default ProfileInfoCard