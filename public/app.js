class TimeManager {
    constructor() {
        this.activities = [];
        this.initializeEventListeners();
        this.addExportListener();
    }
    // Nasłuchiwacze zdarzeń dla formularza
    initializeEventListeners() {
        const form = document.getElementById('activityForm');
        form.addEventListener('submit', (e) => this.handleFormSubmit(e));

        const startInput = document.getElementById('startTime');
        const endInput = document.getElementById('endTime');

        // Usuwanie błędu kiedy urzytownik poprawi
        const validateTimeOrder = () => {
            const startVal = startInput.value;
            const endVal = endInput.value;

            if (startVal && endVal) {
                const start = this.timeToMinutes(startVal);
                const end = this.timeToMinutes(endVal);

                if (end > start) {
                    endInput.setCustomValidity('');
                }
            }
        };

        endInput.addEventListener('input', validateTimeOrder);
        startInput.addEventListener('input', validateTimeOrder);
    }
    
    // Tworzenie nowej aktywności
    async handleFormSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);

        const startTimeStr = formData.get('startTime');
        const endTimeStr = formData.get('endTime');

        const startTime = this.timeToMinutes(startTimeStr);
        const endTime = this.timeToMinutes(endTimeStr);
        const duration = endTime - startTime;

        const startInput = document.getElementById('startTime');
        const endInput = document.getElementById('endTime');

        if (duration <= 0) {
            endInput.setCustomValidity('End time must be later than start time.');
            endInput.reportValidity();
            return;
        } else {
            endInput.setCustomValidity('');
        }

        // Obiekt nowej aktywności
        const activity = {
            id: Date.now(),
            name: formData.get('name'),
            type: formData.get('type'),
            startTime,
            endTime,
            duration,
            importance: parseInt(formData.get('importance'))
        };

        console.log('Adding new activity:', activity);
        this.activities.push(activity);
        await this.validateSchedule();
        this.updateUI();
        e.target.reset();
    }

    // Konwersja czasu na minuty
    timeToMinutes(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    }

    // Konwersja czasu format HH:MM
    minutesToTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }

    // Wysyłanie danych do walidatora (Prolog)
    async validateSchedule() {
        try {
            console.log('Sending activities for validation:', this.activities);
            const response = await fetch('http://localhost:3000/validate-schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ activities: this.activities })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Validation request failed:', errorData);
                return;
            }

            const results = await response.json();
            console.log('Validation results:', results);
            this.displayValidationResults(results);
        } catch (error) {
            console.error('Validation error:', error);
        }
    }
    
    // Wyświetlanie wyniku walidacji w interfejsie
    displayValidationResults(results) {
        const sections = ['conflicts', 'restWarnings', 'duplicates', 'suggestions'];
        
        sections.forEach(section => {
            const element = document.getElementById(section);
            element.innerHTML = '';
            
            if (results[section] && results[section].length > 0) {
                console.log(`Displaying ${section}:`, results[section]);
                const items = results[section].map(item => `<p>• ${item}</p>`).join('');
                element.innerHTML = items;
            }
        });
    }

    // Aktualizuje cały interfejs
    updateUI() {
        this.updateActivityList();
        this.updateTimeline();
        this.updateStatistics();
    }
    
    // Aktualizuje listę aktywności
    updateActivityList() {
        const list = document.getElementById('activityList');
        list.innerHTML = '';

        const sortedActivities = [...this.activities].sort((a, b) => a.startTime - b.startTime);

        console.log("Updating activity list with sorted activities:", sortedActivities);

        sortedActivities.forEach(activity => {
            const item = document.createElement('div');
            item.className = `activity-item ${activity.type}`;
            item.innerHTML = `
                <div class="activity-info">
                    <strong>${activity.name}</strong>
                    <span>${this.minutesToTime(activity.startTime)} - ${this.minutesToTime(activity.endTime)}</span>
                </div>
                <div class="activity-meta">
                    <span>Duration: ${activity.duration}min</span>
                    <span>Importance: ${activity.importance}</span>
                    <button class="edit-btn" data-id="${activity.id}">Edit</button>
                    <button class="delete-btn" data-id="${activity.id}">Delete</button>
                </div>
            `;
            list.appendChild(item);
        });
        
        // Funkcja usuwania
        list.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                this.deleteActivity(id);
            });
        });

        // Funkcja edytowania
        list.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                this.editActivity(id);
            });
        });
    }

    // Aktuallizuje oś czasu aktywności
    updateTimeline() {
        const timeline = document.getElementById('timeline');
        timeline.innerHTML = '';

        const timelineWidth = timeline.clientWidth;
        const dayMinutes = 24 * 60;
        
        this.activities.forEach(activity => {
            const item = document.createElement('div');
            item.className = `timeline-item ${activity.type}`;
            
            const left = (activity.startTime / dayMinutes) * 100;
            const width = (activity.duration / dayMinutes) * 100;
            
            item.style.left = `${left}%`;
            item.style.width = `${width}%`;
            item.title = `${activity.name} (${this.minutesToTime(activity.startTime)} - ${this.minutesToTime(activity.startTime + activity.duration)})`;
            
            timeline.appendChild(item);
        });
    }

    // Aktualizuje statystyki
    updateStatistics() {
        const stats = document.getElementById('statistics');
        
        const totalWork = this.activities
            .filter(a => a.type === 'work')
            .reduce((sum, a) => sum + a.duration, 0);
            
        const totalRest = this.activities
            .filter(a => a.type === 'rest')
            .reduce((sum, a) => sum + a.duration, 0);

        stats.innerHTML = `
            <div class="stat-item">
                <h3>Total Work Time</h3>
                <p>${Math.floor(totalWork / 60)}h ${totalWork % 60}m</p>
            </div>
            <div class="stat-item">
                <h3>Total Rest Time</h3>
                <p>${Math.floor(totalRest / 60)}h ${totalRest % 60}m</p>
            </div>
            <div class="stat-item">
                <h3>Work/Rest Ratio</h3>
                <p>${(totalWork / (totalRest || 1)).toFixed(2)}</p>
            </div>
        `;
    }
    
    // Dodaje obsługę przycisku eksport planu
    addExportListener() {
        const btn = document.getElementById('exportBtn');
        btn.addEventListener('click', () => this.exportScheduleAsText());
    }

    // Eksport harmonogramu jako plik tekstowy
    exportScheduleAsText() {
        const lines = ['Daily Schedule', ''];

        const sorted = [...this.activities].sort((a, b) => a.startTime - b.startTime);

        sorted.forEach((a, index) => {
            const start = this.minutesToTime(a.startTime);
            const end = this.minutesToTime(a.endTime);
            const name = a.name;
            const type = a.type;
            const importance = a.importance;

            lines.push(`${index + 1}. [${start} - ${end}] ${name} (${type}) — Importance: ${importance}`);
        });

        lines.push('');
        const totalWork = this.activities.filter(a => a.type === 'work').reduce((sum, a) => sum + a.duration, 0);
        const totalRest = this.activities.filter(a => a.type === 'rest').reduce((sum, a) => sum + a.duration, 0);
        const ratio = (totalWork / (totalRest || 1)).toFixed(2);

        lines.push(`Total Work Time: ${Math.floor(totalWork / 60)}h ${totalWork % 60}m`);
        lines.push(`Total Rest Time: ${Math.floor(totalRest / 60)}h ${totalRest % 60}m`);
        lines.push(`Work/Rest Ratio: ${ratio}`);

        const content = lines.join('\n');
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'daily_schedule.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Usuwa aktywność (ID)
    deleteActivity(id) {
        this.activities = this.activities.filter(a => a.id !== id);
        localStorage.setItem('activities', JSON.stringify(this.activities));
        this.updateUI();
    }

    // Wczytuje dane do formularza w celu edycji
    editActivity(id) {
        const activity = this.activities.find(a => a.id === id);
        if (!activity) return;

        document.getElementById('name').value = activity.name;
        document.getElementById('type').value = activity.type;
        document.getElementById('startTime').value = this.minutesToTime(activity.startTime);
        document.getElementById('endTime').value = this.minutesToTime(activity.endTime);
        document.getElementById('importance').value = activity.importance;
        this.deleteActivity(id);
    }

}

//Inicjacja aplikacji
const timeManager = new TimeManager(); 