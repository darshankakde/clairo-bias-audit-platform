import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Box, BarChart3, ShieldCheck, Shield, Sparkles, FileText } from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            {/* Top Navigation Bar */}
            <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <div className="bg-indigo-600 p-1.5 rounded-lg">
                                <ShieldCheck className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-xl font-bold text-gray-900 tracking-tight">Clairo</span>
                        </div>
                        <div className="hidden md:flex gap-8 text-sm font-semibold text-gray-600">
                            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
                            <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">How it Works</a>
                        </div>
                        <button 
                            onClick={() => navigate('/upload')}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg font-bold text-sm transition-colors shadow-sm"
                        >
                            Start Audit
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="flex-grow flex flex-col items-center justify-center text-center px-4 py-20 sm:py-28">
                <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 mb-8 border border-emerald-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 cursor-default hover:bg-emerald-100 transition-colors">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                    AI-Powered Bias Audit Platform
                </div>
                
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 tracking-tight max-w-4xl mx-auto leading-[1.15] animate-in fade-in slide-in-from-bottom-4 duration-700">
                    Ensure <span className="text-emerald-500">Fairness</span><br className="hidden sm:block" /> in Every Decision
                </h1>
                
                <p className="mt-8 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-1000">
                    Upload your dataset, detect demographic biases, and get actionable fixes — all before deploying AI systems that affect real people.
                </p>
                
                <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <button 
                        onClick={() => navigate('/upload')}
                        className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 shadow-lg hover:shadow-emerald-500/20 active:scale-95"
                    >
                        Start Free Audit <ArrowRight className="h-5 w-5" />
                    </button>
                    <button 
                        onClick={() => navigate('/upload')}
                        className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 px-8 py-4 rounded-xl font-bold text-lg shadow-sm transition-all hover:scale-105 active:scale-95"
                    >
                        Try Demo Dataset
                    </button>
                </div>
            </main>

            {/* Features Section */}
            <section id="features" className="bg-white py-24 sm:py-32">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center mb-16">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Everything you need to <span className="text-emerald-500">audit bias</span></h2>
                        <p className="mt-4 text-lg leading-8 text-gray-600">A complete toolkit for detecting, understanding, and fixing demographic biases in your datasets.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        {/* Feature 1 */}
                        <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 hover:shadow-md hover:border-emerald-100 transition-all group">
                            <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                                <Box className="h-6 w-6 text-emerald-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Smart Detection</h3>
                            <p className="text-gray-600 leading-relaxed font-medium">Auto-detect sensitive attributes like gender, race, and age using keyword matching and value analysis.</p>
                        </div>
                        {/* Feature 2 */}
                        <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 hover:shadow-md hover:border-emerald-100 transition-all group">
                            <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                                <BarChart3 className="h-6 w-6 text-emerald-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Fairness Metrics</h3>
                            <p className="text-gray-600 leading-relaxed font-medium">Compute Demographic Parity, Equalized Odds, Disparate Impact, and Statistical Parity differences.</p>
                        </div>
                        {/* Feature 3 */}
                        <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 hover:shadow-md hover:border-emerald-100 transition-all group">
                            <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                                <Sparkles className="h-6 w-6 text-emerald-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">AI Explanations</h3>
                            <p className="text-gray-600 leading-relaxed font-medium">Get plain-English explanations of bias findings powered by Gemini — root causes, impact, and severity.</p>
                        </div>
                        {/* Feature 4 */}
                        <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 hover:shadow-md hover:border-emerald-100 transition-all group">
                            <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                                <FileText className="h-6 w-6 text-emerald-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Visual Dashboard</h3>
                            <p className="text-gray-600 leading-relaxed font-medium">Interactive charts showing outcome rates, metric comparisons, and bias severity across attributes.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section id="how-it-works" className="bg-slate-50 py-24 sm:py-32 relative">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
                    <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 p-10 md:p-16 lg:p-20">
                        <div className="mx-auto max-w-2xl text-center mb-16 lg:mb-24">
                            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">How Clairo works</h2>
                            <p className="mt-4 text-lg leading-8 text-gray-500">Four simple steps to a comprehensive bias audit.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16 text-center relative">
                            {/* Optional: Add a connecting line for large screens */}
                            <div className="hidden lg:block absolute top-[28px] left-[12%] right-[12%] h-[2px] bg-gray-100 z-0"></div>

                            {[
                                { step: '1', title: 'Upload Dataset', desc: 'Drop your CSV or Excel file containing the data to audit' },
                                { step: '2', title: 'Confirm Attributes', desc: 'Review and confirm auto-detected sensitive attributes' },
                                { step: '3', title: 'Analyze Fairness', desc: 'Our AI computes multiple fairness metrics across groups' },
                                { step: '4', title: 'Get Insights', desc: 'Receive detailed reports with actionable recommendations' }
                            ].map((item) => (
                                <div key={item.step} className="flex flex-col items-center relative z-10 px-2 lg:px-4">
                                    <div className="bg-indigo-600 shadow-md shadow-indigo-600/20 text-white font-bold text-xl w-14 h-14 rounded-full flex items-center justify-center mb-6 ring-8 ring-white">
                                        {item.step}
                                    </div>
                                    <h4 className="text-[17px] font-bold text-gray-900 mb-3">{item.title}</h4>
                                    <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 text-center px-4 bg-white relative overflow-hidden">
                <Shield className="h-14 w-14 text-emerald-500 mx-auto mb-6 drop-shadow-md" />
                <h2 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">Ready to audit your data?</h2>
                <p className="text-gray-600 mb-10 max-w-md mx-auto font-medium text-lg">Upload a dataset and get a full bias analysis in minutes. No signup required.</p>
                <button 
                    onClick={() => navigate('/upload')}
                    className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-10 py-5 rounded-xl font-bold text-xl transition-all hover:scale-105 shadow-xl hover:shadow-emerald-500/30 active:scale-95"
                >
                    Start Audit Now <ArrowRight className="h-6 w-6" />
                </button>
            </section>

            {/* Footer */}
            <footer className="border-t border-gray-200 bg-gray-50 py-10">
                <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500 font-medium">
                    <div className="flex items-center gap-2 opacity-80">
                        <Shield className="h-5 w-5 text-indigo-600" />
                        <span className="font-bold text-gray-900 text-base">Clairo</span> — AI Bias Audit Platform
                    </div>
                    <div className="opacity-80">Solution Challenge 2026</div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
