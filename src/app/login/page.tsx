"use client";

import { useState } from "react";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e: React.SyntheticEvent) => {
        e.preventDefault();
        // Frontend only - action will be implemented later
        console.log("Login submitted:", { username, password });
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#F5F5F7] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">

            {/* Main Login Card */}
            <div className="w-full max-w-[460px] bg-[#E2E2E2] rounded-[32px] sm:rounded-[36px] px-8 py-9 sm:px-11 sm:py-11 shadow-[0_20px_45px_rgba(0,0,0,0.12)] border border-[#D6D6D6] my-auto">
                {/* Strategy First Logo */}
                <div className="flex flex-col items-center justify-center mb-6">
                    <div className="relative w-35 h-auto flex items-center justify-center">
                        <Image
                            src="/s1st-portrait.png"
                            alt="Strategy First International College"
                            width={200}
                            height={208}
                            priority
                            className="object-contain select-none"
                        />
                    </div>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Username Input Field */}
                    <div className="relative flex items-center bg-white rounded-2xl h-14 px-4 shadow-[0_2px_6px_rgba(0,0,0,0.06)] focus-within:ring-2 focus-within:ring-red-500/50 transition-all">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 640 640"
                            fill="currentColor"
                            className="w-5 h-5 text-black shrink-0 mr-3"
                        >
                            <path d="M470.5 463.6C451.4 416.9 405.5 384 352 384L288 384C234.5 384 188.6 416.9 169.5 463.6C133.9 426.3 112 375.7 112 320C112 205.1 205.1 112 320 112C434.9 112 528 205.1 528 320C528 375.7 506.1 426.2 470.5 463.6zM430.4 496.3C398.4 516.4 360.6 528 320 528C279.4 528 241.6 516.4 209.5 496.3C216.8 459.6 249.2 432 288 432L352 432C390.8 432 423.2 459.6 430.5 496.3zM320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM320 304C297.9 304 280 286.1 280 264C280 241.9 297.9 224 320 224C342.1 224 360 241.9 360 264C360 286.1 342.1 304 320 304zM232 264C232 312.6 271.4 352 320 352C368.6 352 408 312.6 408 264C408 215.4 368.6 176 320 176C271.4 176 232 215.4 232 264z" />
                        </svg>
                        <input
                            type="text"
                            name="username"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Username"
                            required
                            autoComplete="username"
                            className="w-full bg-transparent outline-none text-black font-bold placeholder:text-black placeholder:font-bold text-base sm:text-m"
                        />
                    </div>

                    {/* Password Input Field */}
                    <div className="relative flex items-center bg-white rounded-2xl h-14 px-4 shadow-[0_2px_6px_rgba(0,0,0,0.06)] focus-within:ring-2 focus-within:ring-red-500/50 transition-all">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 -960 960 960"
                            fill="currentColor"
                            className="w-5 h-5 text-black shrink-0 mr-3"
                        >
                            <path d="M223.5-423.5Q200-447 200-480t23.5-56.5Q247-560 280-560t56.5 23.5Q360-513 360-480t-23.5 56.5Q313-400 280-400t-56.5-23.5ZM280-240q-100 0-170-70T40-480q0-100 70-170t170-70q67 0 121.5 33t86.5 87h352l120 120-180 180-80-60-80 60-85-60h-47q-32 54-86.5 87T280-240Zm0-80q56 0 98.5-34t56.5-86h125l58 41 82-61 71 55 75-75-40-40H435q-14-52-56.5-86T280-640q-66 0-113 47t-47 113q0 66 47 113t113 47Z" />
                        </svg>
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••"
                            required
                            autoComplete="current-password"
                            className="w-full bg-transparent outline-none text-black font-bold placeholder:text-black placeholder:font-bold text-base sm:text-m tracking-wider"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="p-1 rounded-full text-gray-400 hover:text-black transition-colors shrink-0"
                            title={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? (
                                <EyeOff className="w-5 h-5" />
                            ) : (
                                <Eye className="w-5 h-5" />
                            )}
                        </button>
                    </div>

                    {/* Forgot Password Link */}
                    <div className="flex justify-end pt-0.5">
                        <button
                            type="button"
                            onClick={() => alert("Forgot password functionality will be connected soon.")}
                            className="text-xs sm:text-sm font-bold text-black hover:text-[#DE0808] transition-colors"
                        >
                            Forgot Password?
                        </button>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            className="w-full h-13 sm:h-14 bg-[#DE0808] hover:bg-[#C20707] active:scale-[0.98] text-white font-bold text-xl sm:text-2xl rounded-2xl shadow-[0_4px_14px_rgba(222,8,8,0.35)] transition-all flex items-center justify-center cursor-pointer tracking-wide"
                        >
                            Login
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
