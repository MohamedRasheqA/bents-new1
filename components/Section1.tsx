'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MessageSquare, LayoutDashboard } from 'lucide-react';
import axios from "axios";
import { cn } from '@/lib/utils';
import { SignInButton, SignedIn, SignedOut } from '@clerk/nextjs'; 
 
// Types
interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface FormMessage {
  type: string;
  content: string;
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface Section1Props {
  onStartChatting: () => void;
  isSignedIn?: boolean;
}

// SVG Component
function ToolRecommendationLogo({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14 5L21 3V19L14 21V5Z"
        fill="#4A5568"
        stroke="#2D3748"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 5L10 3V19L3 21V5Z"
        fill="#4A5568"
        stroke="#2D3748"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 12H21"
        stroke="#2D3748"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="9" r="1" fill="#2D3748" />
      <circle cx="17" cy="15" r="1" fill="#2D3748" />
    </svg>
  );
}

// Feature Card Component
function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className={cn(
      "bg-gray-100 p-6 rounded-[8px]",
      "transform transition-all duration-300 ease-in-out",
      "hover:shadow-lg hover:scale-[1.02]",
      "border border-transparent",
      "hover:border-blue-200",
      "bg-gradient-to-br from-white to-gray-50",
      "hover:from-blue-50 hover:to-white",
      "group relative overflow-hidden",
      "after:absolute after:inset-0 after:opacity-0",
      "after:transition-opacity after:duration-300",
      "after:bg-gradient-to-br after:from-blue-100/20 after:to-transparent",
      "hover:after:opacity-100"
    )}>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 
                    pointer-events-none transition-opacity duration-300
                    bg-gradient-to-r from-transparent via-white/10 to-transparent
                    transform -translate-x-full group-hover:translate-x-full
                    motion-reduce:transition-none motion-reduce:hover:transform-none" 
           style={{ transition: 'transform 1s ease-in-out' }}
      />

      <div className={cn(
        "text-black mb-4 transform transition-transform duration-300",
        "group-hover:scale-110 group-hover:text-blue-600"
      )}>
        {icon}
      </div>

      <h3 className={cn(
        "text-black text-xl font-semibold mb-2",
        "transform transition-colors duration-300",
        "group-hover:text-blue-700"
      )}>
        {title}
      </h3>

      <p className={cn(
        "text-gray-700",
        "transition-colors duration-300",
        "group-hover:text-gray-900"
      )}>
        {description}
      </p>
    </div>
  );
}

export default function Section1({ onStartChatting, isSignedIn }: Section1Props) {
  console.log('isSignedIn:', isSignedIn);
  
  // Add this useEffect for debugging
  useEffect(() => {
    console.log('Clerk environment:', {
      publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      signInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    });
  }, []);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState<FormMessage>({ type: '', content: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormMessage({ type: '', content: '' });

    try {
      const response = await axios.post('https://bents-backend-server.vercel.app/contact', formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      setFormMessage({ type: 'success', content: response.data.message });
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error: any) {
      console.error('Error submitting form:', error);
      setFormMessage({ 
        type: 'error', 
        content: error.response?.data?.message || 'An error occurred while submitting the form. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="bg-black text-white">
        <div className="container mx-auto px-4 py-16 flex flex-col items-center text-center min-h-[calc(50vh-4rem)]">
          <h1 className="text-[rgba(23,155,215,255)] text-3xl md:text-4xl lg:text-4xl font-bold mb-6">
            Welcome to Bent's Woodworking Assistant
          </h1>
          <p className="text-white text-lg md:text-xl lg:text-2xl mb-8 max-w-3xl">
            Your AI-powered companion for all things woodworking. Get expert advice, tool recommendations, and shop improvement tips.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <SignedOut>
              <SignInButton mode="modal">
                <button 
                  className={cn(
                    "inline-block bg-[rgba(23,155,215,255)] text-black font-semibold",
                    "py-3 px-6 w-full sm:w-48 rounded-[8px]",
                    "touch-manipulation",
                    "hover:bg-[rgba(20,139,193,255)] active:bg-[rgba(18,125,174,255)]",
                    "transform transition-all duration-300 ease-in-out",
                    "hover:scale-105 active:scale-95",
                    "hover:shadow-lg active:shadow-inner",
                    "relative overflow-hidden group",
                    "hover:ring-2 hover:ring-blue-300 hover:ring-opacity-50",
                    "before:absolute before:inset-0",
                    "before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
                    "before:translate-x-[-200%] before:transition-transform before:duration-700",
                    "hover:before:translate-x-[200%]",
                    "tap-highlight-transparent",
                    "focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
                  )}
                >
                  <span className="relative z-10">Sign In/Up to Chat</span>
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <button 
                onClick={onStartChatting}
                className={cn(
                  "inline-block bg-[rgba(23,155,215,255)] text-black font-semibold",
                  "py-3 px-6 w-full sm:w-48 rounded-[8px]",
                  "touch-manipulation",
                  "hover:bg-[rgba(20,139,193,255)] active:bg-[rgba(18,125,174,255)]",
                  "transform transition-all duration-300 ease-in-out",
                  "hover:scale-105 active:scale-95",
                  "hover:shadow-lg active:shadow-inner",
                  "relative overflow-hidden group",
                  "hover:ring-2 hover:ring-blue-300 hover:ring-opacity-50",
                  "before:absolute before:inset-0",
                  "before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
                  "before:translate-x-[-200%] before:transition-transform before:duration-700",
                  "hover:before:translate-x-[200%]",
                  "tap-highlight-transparent",
                  "focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
                )}
              >
                <span className="relative z-10">Start Chatting</span>
              </button>
            </SignedIn>

            <Link 
              href="/shop" 
              className={cn(
                "inline-block bg-black text-white font-semibold",
                "py-3 px-6 w-full sm:w-48 rounded-[8px]",
                "border-2 border-white",
                "touch-manipulation",
                "hover:bg-white hover:text-black active:bg-gray-100",
                "transform transition-all duration-300 ease-in-out",
                "hover:scale-105 active:scale-95",
                "hover:shadow-lg active:shadow-inner",
                "relative overflow-hidden group",
                "hover:ring-2 hover:ring-white hover:ring-opacity-50",
                "before:absolute before:inset-0",
                "before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
                "before:translate-x-[-200%] before:transition-transform before:duration-700",
                "hover:before:translate-x-[200%]",
                "tap-highlight-transparent",
                "focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
              )}
            >
              <span className="relative z-10">Shop Now</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-black text-3xl md:text-4xl font-bold mb-12 text-center">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<MessageSquare size={40} />}
              title="Expert Advice"
              description="Get instant answers to your woodworking questions from our AI assistant."
            />
            <FeatureCard 
              icon={<ToolRecommendationLogo className="w-10 h-10" />}
              title="Tool Recommendations"
              description="Discover the best tools for your projects with personalized suggestions."
            />
            <FeatureCard 
              icon={<LayoutDashboard size={40} />}
              title="Shop Improvement"
              description="Learn how to optimize your workspace for better efficiency and safety."
            />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="bg-gray-200 py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center">
            <div className="lg:w-1/2 lg:pr-8 mb-8 lg:mb-0">
              <h2 className="text-black text-3xl md:text-4xl font-bold mb-6">
                About Bent's Woodworking Assistant
              </h2>
              <p className="text-black text-lg leading-relaxed">
                Bent's Woodworking Assistant is an AI-powered tool designed to help woodworkers of all skill levels. Whether you're a beginner looking for guidance or an experienced craftsman seeking to optimize your workflow, our assistant is here to help.
              </p>
              <p className="text-black text-lg leading-relaxed mt-4">
                With a vast knowledge base covering techniques, tools, and shop management, we're your go-to resource for all things woodworking.
              </p>
            </div>
            <div className="lg:w-1/2">
              <Image
                src="/bents-image.jpg"
                alt="Woodworking Workshop"
                width={600}
                height={400}
                className="rounded-[8px] shadow-lg"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-[rgba(23,155,215,255)] py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-black text-3xl md:text-4xl font-bold mb-8 text-center">Contact Us</h2>
          <form className="max-w-lg mx-auto" onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-black font-semibold mb-2">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[rgba(23,155,215,255)]"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="email" className="block text-black font-semibold mb-2">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[rgba(23,155,215,255)]"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="subject" className="block text-black font-semibold mb-2">Subject</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[rgba(23,155,215,255)]"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="message" className="block text-black font-semibold mb-2">Your Message</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[rgba(23,155,215,255)]"
                required
              ></textarea>
            </div>
            {formMessage.content && (
              <div className={`mb-4 p-2 rounded-[8px] ${formMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {formMessage.content}
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-black text-white font-semibold py-2 px-4 rounded-[8px] hover:bg-gray-800 transition duration-300"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
