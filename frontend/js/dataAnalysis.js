// OBB Baseline Survey System - Data Analysis Dashboard for Admins

window.DataAnalysis = {
    // Initialize data analysis dashboard
    init: function() {
        console.log('Data analysis dashboard initialized');
        this.currentView = 'overview';
        this.filters = {
            dateRange: 'all',
            district: 'all',
            agent: 'all',
            status: 'all'
        };
        this.surveys = [];
        this.statistics = {};
    },
    
    // Build main data analysis dashboard
    buildDashboard: function() {
        return `
            <div class="data-analysis-dashboard">
                <!-- Header with Filters -->
                <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        <div>
                            <h2 class="text-2xl font-bold text-gray-800">Data Analysis Dashboard</h2>
                            <p class="text-gray-600">Comprehensive analysis of survey data collected by agents</p>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="DataAnalysis.exportData()" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                                <i class="fas fa-download mr-2"></i>Export Data
                            </button>
                            <button onclick="DataAnalysis.refreshData()" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                                <i class="fas fa-sync mr-2"></i>Refresh
                            </button>
                        </div>
                    </div>
                    
                    <!-- Filters -->
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                            <select id="dateRangeFilter" onchange="DataAnalysis.applyFilters()" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                <option value="all">All Time</option>
                                <option value="today">Today</option>
                                <option value="week">This Week</option>
                                <option value="month">This Month</option>
                                <option value="quarter">This Quarter</option>
                                <option value="year">This Year</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">District</label>
                            <select id="districtFilter" onchange="DataAnalysis.applyFilters()" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                <option value="all">All Districts</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Agent</label>
                            <select id="agentFilter" onchange="DataAnalysis.applyFilters()" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                <option value="all">All Agents</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select id="statusFilter" onchange="DataAnalysis.applyFilters()" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                <option value="all">All Status</option>
                                <option value="submitted">Submitted</option>
                                <option value="draft">Draft</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <!-- Navigation Tabs -->
                <div class="bg-white rounded-lg shadow-md mb-6">
                    <div class="border-b border-gray-200">
                        <nav class="flex space-x-8 px-6" aria-label="Tabs">
                            <button onclick="DataAnalysis.showView('overview')" class="tab-btn py-4 px-1 border-b-2 font-medium text-sm border-blue-500 text-blue-600" data-view="overview">
                                Overview
                            </button>
                            <button onclick="DataAnalysis.showView('surveys')" class="tab-btn py-4 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300" data-view="surveys">
                                Surveys
                            </button>
                            <button onclick="DataAnalysis.showView('demographics')" class="tab-btn py-4 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300" data-view="demographics">
                                Demographics
                            </button>
                            <button onclick="DataAnalysis.showView('clans')" class="tab-btn py-4 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300" data-view="clans">
                                Clans
                            </button>
                            <button onclick="DataAnalysis.showView('saving-groups')" class="tab-btn py-4 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300" data-view="saving-groups">
                                Saving Groups
                            </button>
                            <button onclick="DataAnalysis.showView('agents')" class="tab-btn py-4 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300" data-view="agents">
                                Agents
                            </button>
                        </nav>
                    </div>
                </div>
                
                <!-- Content Area -->
                <div id="analysisContent" class="bg-white rounded-lg shadow-md p-6">
                    <!-- Content will be loaded here -->
                </div>
            </div>
        `;
    },
    
    // Show specific view
    showView: function(view) {
        this.currentView = view;
        
        // Update tab styling
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.dataset.view === view) {
                btn.classList.add('border-blue-500', 'text-blue-600');
                btn.classList.remove('border-transparent', 'text-gray-500');
            } else {
                btn.classList.remove('border-blue-500', 'text-blue-600');
                btn.classList.add('border-transparent', 'text-gray-500');
            }
        });
        
        // Load content based on view
        const contentDiv = document.getElementById('analysisContent');
        if (!contentDiv) return;
        
        switch(view) {
            case 'overview':
                contentDiv.innerHTML = this.buildOverviewView();
                setTimeout(() => this.initializeOverviewCharts(), 100);
                break;
            case 'surveys':
                contentDiv.innerHTML = this.buildSurveysView();
                setTimeout(() => this.loadSurveysTable(), 100);
                break;
            case 'demographics':
                contentDiv.innerHTML = this.buildDemographicsView();
                setTimeout(() => this.initializeDemographicsCharts(), 100);
                break;
            case 'clans':
                contentDiv.innerHTML = this.buildClansView();
                setTimeout(() => this.loadClansTable(), 100);
                break;
            case 'saving-groups':
                contentDiv.innerHTML = this.buildSavingGroupsView();
                setTimeout(() => this.loadSavingGroupsTable(), 100);
                break;
            case 'agents':
                contentDiv.innerHTML = this.buildAgentsView();
                setTimeout(() => this.loadAgentsTable(), 100);
                break;
        }
    },
    
    // Build overview view
    buildOverviewView: function() {
        return `
            <div class="space-y-6">
                <!-- Key Metrics Cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-blue-100">Total Surveys</p>
                                <p class="text-3xl font-bold" id="totalSurveysCount">-</p>
                                <p class="text-sm text-blue-100 mt-1">Last 30 days: <span id="recentSurveysCount">-</span></p>
                            </div>
                            <div class="bg-blue-400 bg-opacity-30 rounded-full p-3">
                                <i class="fas fa-clipboard-list text-2xl"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-green-100">Active Agents</p>
                                <p class="text-3xl font-bold" id="activeAgentsCount">-</p>
                                <p class="text-sm text-green-100 mt-1">Total: <span id="totalAgentsCount">-</span></p>
                            </div>
                            <div class="bg-green-400 bg-opacity-30 rounded-full p-3">
                                <i class="fas fa-users text-2xl"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-purple-100">Total Clans</p>
                                <p class="text-3xl font-bold" id="totalClansCount">-</p>
                                <p class="text-sm text-purple-100 mt-1">Avg size: <span id="avgClanSize">-</span></p>
                            </div>
                            <div class="bg-purple-400 bg-opacity-30 rounded-full p-3">
                                <i class="fas fa-shield-alt text-2xl"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-orange-100">Total Population</p>
                                <p class="text-3xl font-bold" id="totalPopulationCount">-</p>
                                <p class="text-sm text-orange-100 mt-1">Households: <span id="totalHouseholdsCount">-</span></p>
                            </div>
                            <div class="bg-orange-400 bg-opacity-30 rounded-full p-3">
                                <i class="fas fa-users text-2xl"></i>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Charts Row -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Survey Trends Chart -->
                    <div class="bg-gray-50 rounded-lg p-6">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">Survey Submission Trends</h3>
                        <canvas id="surveyTrendsChart" width="400" height="200"></canvas>
                    </div>
                    
                    <!-- District Distribution Chart -->
                    <div class="bg-gray-50 rounded-lg p-6">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">Surveys by District</h3>
                        <canvas id="districtChart" width="400" height="200"></canvas>
                    </div>
                </div>
                
                <!-- Recent Activity Table -->
                <div class="bg-gray-50 rounded-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Recent Survey Activity</h3>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-100">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clan</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">District</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="recentActivityTable" class="bg-white divide-y divide-gray-200">
                                <!-- Data will be loaded here -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Build surveys view with detailed table
    buildSurveysView: function() {
        return `
            <div class="space-y-4">
                <!-- Search and Actions Bar -->
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div class="flex-1 max-w-lg">
                        <div class="relative">
                            <input type="text" id="surveySearch" placeholder="Search surveys..." 
                                   class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
                                   onkeyup="DataAnalysis.searchSurveys()">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center">
                                <i class="fas fa-search text-gray-400"></i>
                            </div>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="DataAnalysis.exportSurveys()" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                            <i class="fas fa-download mr-2"></i>Export
                        </button>
                    </div>
                </div>
                
                <!-- Surveys Table -->
                <div class="overflow-x-auto bg-white rounded-lg shadow">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onclick="DataAnalysis.sortTable('id')">
                                    ID <i class="fas fa-sort text-gray-400 ml-1"></i>
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onclick="DataAnalysis.sortTable('submitted_at')">
                                    Date <i class="fas fa-sort text-gray-400 ml-1"></i>
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onclick="DataAnalysis.sortTable('clan_name')">
                                    Clan <i class="fas fa-sort text-gray-400 ml-1"></i>
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onclick="DataAnalysis.sortTable('district')">
                                    District <i class="fas fa-sort text-gray-400 ml-1"></i>
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onclick="DataAnalysis.sortTable('agent_name')">
                                    Agent <i class="fas fa-sort text-gray-400 ml-1"></i>
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Population
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Households
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody id="surveysTableBody" class="bg-white divide-y divide-gray-200">
                            <!-- Data will be loaded here -->
                        </tbody>
                    </table>
                </div>
                
                <!-- Pagination -->
                <div id="surveysPagination" class="flex justify-between items-center">
                    <!-- Pagination will be loaded here -->
                </div>
            </div>
        `;
    },
    
    // Build demographics view
    buildDemographicsView: function() {
        return `
            <div class="space-y-6">
                <!-- Population Overview Cards -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="bg-blue-50 rounded-lg p-6 border border-blue-200">
                        <h4 class="text-lg font-semibold text-blue-800 mb-2">Total Population</h4>
                        <p class="text-3xl font-bold text-blue-600" id="demoTotalPop">-</p>
                        <div class="mt-4 space-y-2">
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600">Male:</span>
                                <span class="font-medium" id="demoMalePop">-</span>
                            </div>
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600">Female:</span>
                                <span class="font-medium" id="demoFemalePop">-</span>
                            </div>
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600">Youth:</span>
                                <span class="font-medium" id="demoYouthPop">-</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-green-50 rounded-lg p-6 border border-green-200">
                        <h4 class="text-lg font-semibold text-green-800 mb-2">Households</h4>
                        <p class="text-3xl font-bold text-green-600" id="demoTotalHouseholds">-</p>
                        <div class="mt-4">
                            <div class="text-sm text-gray-600">Avg. Household Size:</div>
                            <div class="text-xl font-bold text-green-600" id="demoAvgHouseholdSize">-</div>
                        </div>
                    </div>
                    
                    <div class="bg-purple-50 rounded-lg p-6 border border-purple-200">
                        <h4 class="text-lg font-semibold text-purple-800 mb-2">Educated Persons</h4>
                        <p class="text-3xl font-bold text-purple-600" id="demoEducatedCount">-</p>
                        <div class="mt-4">
                            <div class="text-sm text-gray-600">Degree Holders:</div>
                            <div class="text-xl font-bold text-purple-600" id="demoDegreeHolders">-</div>
                        </div>
                    </div>
                </div>
                
                <!-- Demographics Charts -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Gender Distribution -->
                    <div class="bg-gray-50 rounded-lg p-6">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">Gender Distribution</h3>
                        <canvas id="genderChart" width="400" height="300"></canvas>
                    </div>
                    
                    <!-- Age Distribution -->
                    <div class="bg-gray-50 rounded-lg p-6">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">Age Groups</h3>
                        <canvas id="ageChart" width="400" height="300"></canvas>
                    </div>
                </div>
                
                <!-- Education Levels -->
                <div class="bg-gray-50 rounded-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Education Levels by District</h3>
                    <canvas id="educationChart" width="800" height="300"></canvas>
                </div>
                
                <!-- Population by District Table -->
                <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Population Statistics by District</h3>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-100">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">District</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Population</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Male</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Female</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Households</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg. Size</th>
                                </tr>
                            </thead>
                            <tbody id="populationTableBody" class="bg-white divide-y divide-gray-200">
                                <!-- Data will be loaded here -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Initialize overview charts
    initializeOverviewCharts: function() {
        this.loadOverviewData();
        
        // Survey Trends Chart
        const trendsCtx = document.getElementById('surveyTrendsChart');
        if (trendsCtx && this.statistics.monthly_submissions) {
            new Chart(trendsCtx, {
                type: 'line',
                data: {
                    labels: this.statistics.monthly_submissions.labels,
                    datasets: [{
                        label: 'Surveys Submitted',
                        data: this.statistics.monthly_submissions.data,
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
        
        // District Distribution Chart
        const districtCtx = document.getElementById('districtChart');
        if (districtCtx && this.statistics.district_data) {
            new Chart(districtCtx, {
                type: 'doughnut',
                data: {
                    labels: this.statistics.district_data.labels,
                    datasets: [{
                        data: this.statistics.district_data.data,
                        backgroundColor: [
                            '#3B82F6',
                            '#10B981',
                            '#F59E0B',
                            '#EF4444',
                            '#8B5CF6',
                            '#EC4899'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    },
    
    // Load overview data
    loadOverviewData: async function() {
        try {
            // Get surveys data
            const surveysResponse = await SurveyAPI.getSurveys();
            if (surveysResponse.success) {
                this.surveys = surveysResponse.data;
                this.statistics = await SurveyAPI.getStatistics();
                
                // Update metrics cards
                this.updateOverviewMetrics();
                
                // Load recent activity table
                this.loadRecentActivity();
            }
        } catch (error) {
            console.error('Failed to load overview data:', error);
            // Use mock data
            this.loadMockOverviewData();
        }
    },
    
    // Load mock overview data for demo
    loadMockOverviewData: function() {
        // Generate mock statistics
        this.statistics = {
            total_surveys: 156,
            monthly_submissions: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                data: [12, 19, 15, 25, 22, 30]
            },
            district_data: {
                labels: ['Central', 'Eastern', 'Northern', 'Western'],
                data: [45, 38, 32, 41]
            }
        };
        
        // Generate mock surveys
        this.surveys = this.generateMockSurveys();
        
        // Update metrics
        this.updateOverviewMetrics();
        this.loadRecentActivity();
    },
    
    // Generate mock surveys for demo
    generateMockSurveys: function() {
        const mockSurveys = [];
        const districts = ['Central', 'Eastern', 'Northern', 'Western'];
        const agents = ['Agent 1', 'Agent 2', 'Agent 3'];
        const clans = ['Clan Alpha', 'Clan Beta', 'Clan Gamma', 'Clan Delta'];
        
        for (let i = 1; i <= 50; i++) {
            mockSurveys.push({
                id: i,
                clan_name: clans[Math.floor(Math.random() * clans.length)],
                district: districts[Math.floor(Math.random() * districts.length)],
                agent_name: agents[Math.floor(Math.random() * agents.length)],
                total_population: Math.floor(Math.random() * 500) + 100,
                total_households: Math.floor(Math.random() * 100) + 20,
                male_population: Math.floor(Math.random() * 250) + 50,
                female_population: Math.floor(Math.random() * 250) + 50,
                youth_population: Math.floor(Math.random() * 100) + 20,
                submitted_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
                status: Math.random() > 0.1 ? 'submitted' : 'draft'
            });
        }
        
        return mockSurveys;
    },
    
    // Update overview metrics
    updateOverviewMetrics: function() {
        const totalSurveys = this.surveys.length;
        const submittedSurveys = this.surveys.filter(s => s.status === 'submitted').length;
        const recentSurveys = this.surveys.filter(s => {
            const submittedDate = new Date(s.submitted_at);
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            return submittedDate > thirtyDaysAgo;
        }).length;
        
        // Calculate unique agents
        const uniqueAgents = [...new Set(this.surveys.map(s => s.agent_name))];
        
        // Calculate total population and households
        const totalPopulation = this.surveys.reduce((sum, s) => sum + (s.total_population || 0), 0);
        const totalHouseholds = this.surveys.reduce((sum, s) => sum + (s.total_households || 0), 0);
        
        // Calculate unique clans
        const uniqueClans = [...new Set(this.surveys.map(s => s.clan_name))];
        
        // Update DOM elements
        document.getElementById('totalSurveysCount').textContent = totalSurveys;
        document.getElementById('recentSurveysCount').textContent = recentSurveys;
        document.getElementById('activeAgentsCount').textContent = uniqueAgents.length;
        document.getElementById('totalAgentsCount').textContent = uniqueAgents.length;
        document.getElementById('totalClansCount').textContent = uniqueClans.length;
        document.getElementById('avgClanSize').textContent = totalHouseholds > 0 ? 
            Math.round(totalPopulation / totalHouseholds) : 0;
        document.getElementById('totalPopulationCount').textContent = totalPopulation.toLocaleString();
        document.getElementById('totalHouseholdsCount').textContent = totalHouseholds.toLocaleString();
    },
    
    // Load recent activity table
    loadRecentActivity: function() {
        const tbody = document.getElementById('recentActivityTable');
        if (!tbody) return;
        
        // Get recent 10 surveys
        const recentSurveys = this.surveys
            .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
            .slice(0, 10);
        
        tbody.innerHTML = recentSurveys.map(survey => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${new Date(survey.submitted_at).toLocaleDateString()}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${survey.clan_name}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${survey.agent_name}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${survey.district}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        survey.status === 'submitted' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                    }">
                        ${survey.status}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="DataAnalysis.viewSurveyDetails(${survey.id})" class="text-blue-600 hover:text-blue-900 mr-2">
                        View
                    </button>
                </td>
            </tr>
        `).join('');
    },
    
    // Apply filters
    applyFilters: function() {
        const dateRange = document.getElementById('dateRangeFilter').value;
        const district = document.getElementById('districtFilter').value;
        const agent = document.getElementById('agentFilter').value;
        const status = document.getElementById('statusFilter').value;
        
        this.filters = { dateRange, district, agent, status };
        
        // Reload current view with filters
        this.showView(this.currentView);
    },
    
    // Export data
    exportData: function() {
        // Create CSV content
        const headers = ['ID', 'Clan Name', 'District', 'Agent', 'Population', 'Households', 'Status', 'Submitted Date'];
        const rows = this.surveys.map(survey => [
            survey.id,
            survey.clan_name,
            survey.district,
            survey.agent_name,
            survey.total_population,
            survey.total_households,
            survey.status,
            new Date(survey.submitted_at).toLocaleDateString()
        ]);
        
        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
        
        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `survey_data_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    },
    
    // Refresh data
    refreshData: function() {
        this.showView(this.currentView);
    },
    
    // View survey details
    viewSurveyDetails: function(surveyId) {
        const survey = this.surveys.find(s => s.id === surveyId);
        if (!survey) return;
        
        // Create modal with survey details
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50';
        modal.innerHTML = `
            <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                <div class="mt-3">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-medium text-gray-900">Survey Details</h3>
                        <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Clan Name</label>
                                <p class="mt-1 text-sm text-gray-900">${survey.clan_name}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">District</label>
                                <p class="mt-1 text-sm text-gray-900">${survey.district}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Agent</label>
                                <p class="mt-1 text-sm text-gray-900">${survey.agent_name}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Status</label>
                                <p class="mt-1 text-sm text-gray-900">${survey.status}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Total Population</label>
                                <p class="mt-1 text-sm text-gray-900">${survey.total_population}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Households</label>
                                <p class="mt-1 text-sm text-gray-900">${survey.total_households}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Submitted Date</label>
                                <p class="mt-1 text-sm text-gray-900">${new Date(survey.submitted_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
};
