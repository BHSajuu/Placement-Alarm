"use client"

import { useState, useEffect } from "react"
import { SignedIn, SignOutButton, useUser } from "@clerk/nextjs"
import { useMutation, useQuery } from "convex/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Mail, Edit3, Save, X,  ArrowLeft, Shield, Bell, Camera, Loader } from "lucide-react"
import toast from "react-hot-toast"
import Image from "next/image"
import Link from "next/link"
import { api } from "../../../../convex/_generated/api"
import ProfileInfoCard from "@/components/profile/profile-infoCard"
import LoadingSkeleton from "@/components/profile/loading-skeleton"

export default function Profile() {
  const { user, isLoaded } = useUser()
  const [isEditing, setIsEditing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  })

const profile = useQuery(
    api.profiles.getUserProfile,
    user?.id ? { userId: user.id } : "skip"
  )

  const upsertProfile = useMutation(api.profiles.upsertProfile)
  const updateProfileImage = useMutation(api.profiles.updateProfileImage)
  const generateUploadUrl = useMutation(api.profiles.generateUploadUrl);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        email: profile.email || "",
      })
    }
  }, [profile])

  const handleSave = async () => {
    if (!user) return

    try {
      await upsertProfile({
        userId: user.id,
        name: formData.name,
        email: formData.email,
      })
      
      toast.success("Profile updated successfully!")
      setIsEditing(false)
    } catch (error) {
      toast.error("Failed to update profile")
      console.error("Profile update error:", error)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        email: profile.email || "",
      })
    }
    setIsEditing(false)
  }
 
const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    setIsUploading(true);
    const toastId = toast.loading("Uploading image...");

    try {
      // 1. Get the upload URL from Convex
      const postUrl = await generateUploadUrl();

      // 2. Upload the file to that URL using 'fetch'
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      // 3. Get the storageId from the response
      const { storageId } = await result.json();

      // 4. Save the new storageId to the user's profile
      await updateProfileImage({ 
        userId: user.id, 
        storageId: storageId 
      });

      toast.success("Profile image updated successfully!", { id: toastId });
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error("Failed to update profile image", { id: toastId });
    } finally {
      setIsUploading(false);
      event.target.value = ""; 
    }
  }

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!isLoaded || profile === undefined) {
       return <LoadingSkeleton />
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-75 animate-pulse"></div>
            <div className="relative bg-gray-800 p-6 rounded-full">
              <User className="h-16 w-16 text-purple-400" />
            </div>
          </div>
          <p className="text-gray-300 text-xl font-medium">Please sign in to view your profile</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12" style={{ animation: "fadeInUp 0.8s ease-out" }}>
       
        <Link href="/">
          <div className="group mb-8 inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-all duration-300 cursor-pointer">
            <div className="p-2 rounded-full bg-gray-800/50 group-hover:bg-gray-700/50 transition-all duration-300">
              <ArrowLeft className="h-4 w-4" />
            </div>
            <span className="font-medium">Back to Dashboard</span>
          </div>
        </Link>

        <div className="bg-gray-800/40 backdrop-blur-3xl rounded-3xl border border-gray-700/50 shadow-2xl overflow-hidden">
          {/* Header Section */}
          <div className="relative bg-gradient-to-r from-blue-300/20 via-blue-600/20 to-blue-600/20 p-8 border-b border-gray-700/50">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-pink-600/5"></div>
            <div className="relative flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
              {/* Profile Image */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                <div className="relative">
                  <Image
                    src={profile?.imageUrl  || "/default-avatar.png"}
                    alt="Profile"
                    width={120}
                    height={120}
                    className="rounded-full border-4 border-gray-700/50 shadow-2xl"
                  />
                  <div className="absolute -bottom-2 -right-2 p-2 bg-gradient-to-r from-purple-900 to-gray-900 rounded-full shadow-lg">
                    <label htmlFor="profileImageUpload" className={`hover:cursor-pointer ${isUploading ? 'cursor-not-allowed' : ''}`}>
                      {isUploading ? (
                        <Loader className="h-4 w-4 text-white animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4 text-white" />
                      )}
                    </label>
                    <input
                      id="profileImageUpload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                    />
                  </div>
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-300 bg-clip-text text-transparent mb-2">
                  {formData.name || "User Profile"}
                </h1>
                <p className="text-gray-400 text-lg mb-4">{formData.email}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                  <div className="flex items-center space-x-2 bg-gray-700/30 rounded-full px-4 py-2">
                    <Shield className="h-4 w-4 text-green-400" />
                    <span className="text-sm text-gray-300">Verified Account</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-gray-700/30 rounded-full px-4 py-2">
                    <Bell className="h-4 w-4 text-blue-400" />
                    <span className="text-sm text-gray-300">Notifications Active</span>
                  </div>
                </div>
              </div>

             <div className="flex flex-col items-center gap-6 mt-6 md:mt-0">
               {/* Edit Button */}
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-indigo-400 hover:bg-indigo-600  hover:text-gray-200 border-0 shadow-xl hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 transform hover:scale-105 rounded-full px-6 py-3"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex space-x-3">
                  <Button
                    onClick={handleSave}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 shadow-xl rounded-full px-6 py-3"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    onClick={handleCancel}
                    className="bg-gray-700/50 border border-gray-600/50 text-white hover:bg-gray-600/70 rounded-full px-6 py-3"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
               <SignedIn>
                 <Button 
                 asChild
                 className="bg-red-400 hover:bg-red-600 text-white border-0 shadow-xl hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 transform hover:scale-105 rounded-full px-6 py-3">
                  <SignOutButton />
                 </Button>
               </SignedIn>
             </div>
              
            </div>
          </div>

          {/* Form Section */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Name Field */}
              <div className="space-y-3">
                <Label htmlFor="name" className="text-gray-300 font-medium flex items-center gap-2 text-lg">
                  <div className="p-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg">
                    <User className="h-4 w-4 text-blue-400" />
                  </div>
                  Full Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  disabled={!isEditing}
                  className={`h-14 bg-gray-700/30 border-gray-600/50 text-white placeholder:text-gray-400 transition-all duration-300 rounded-xl text-lg ${
                    isEditing ? "focus:border-purple-500 focus:bg-gray-700/50 focus:shadow-lg focus:shadow-purple-500/20" : "opacity-70"
                  }`}
                  placeholder="Enter your full name"
                />
              </div>

              {/* Email Field */}
              <div className="space-y-3">
                <Label htmlFor="email" className="text-gray-300 font-medium flex items-center gap-2 text-lg">
                  <div className="p-2 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg">
                    <Mail className="h-4 w-4 text-green-400" />
                  </div>
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  disabled={!isEditing}
                  className={`h-14 bg-gray-700/30 border-gray-600/50 text-white placeholder:text-gray-400 transition-all duration-300 rounded-xl text-lg ${
                    isEditing ? "focus:border-purple-500 focus:bg-gray-700/50 focus:shadow-lg focus:shadow-purple-500/20" : "opacity-70"
                  }`}
                  placeholder="Enter your email address"
                />
              </div>
            </div>
            {/* Info Card */}
            <ProfileInfoCard />
          </div>
        </div>
      </div>
    </div>
  )
}