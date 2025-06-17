const express = require('express'); // serce
const cors = require('cors'); //połaczenie z serverem
const bodyParser = require('body-parser');
const path = require('path');
const { exec } = require('child_process'); //komnedy systemowe
const fs = require('fs').promises; //await
const util = require('util');
const execPromise = util.promisify(exec);

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));


app.post('/validate-schedule', async (req, res) => {
    try {
        const schedule = req.body;
        console.log('Received schedule:', schedule);
        
        if (!schedule.activities || !Array.isArray(schedule.activities)) {
            return res.status(400).json({ error: 'Invalid schedule format' });
        }

        const prologFacts = generatePrologFacts(schedule);
        console.log('Generated Prolog facts:', prologFacts);
        
        const validatorContent = await fs.readFile('validator.pl', 'utf8');
        
        const combinedContent = `
${validatorContent}
${prologFacts}

:- (validate_schedule, halt(0)) ; halt(1).
`;

        const tempFile = 'temp_schedule.pl';
        await fs.writeFile(tempFile, combinedContent);
        console.log('Created temporary Prolog file');

        try {
            const { stdout, stderr } = await execPromise('swipl -q -s temp_schedule.pl');
            console.log('Prolog stdout:', stdout);
            if (stderr) console.error('Prolog stderr:', stderr);

            const results = parsePrologOutput(stdout);
            console.log('Parsed validation results:', results);
            res.json(results);

        } catch (error) {
            console.error('Prolog execution error:', error);
            if (error.stdout) console.log('Error stdout:', error.stdout);
            if (error.stderr) console.error('Error stderr:', error.stderr);
            res.status(500).json({ 
                error: 'Validation failed', 
                details: error.message,
                stdout: error.stdout,
                stderr: error.stderr
            });
        } finally {
            try {
                await fs.unlink(tempFile);
            } catch (e) {
                console.error('Error cleaning up temporary file:', e);
            }
        }
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

function generatePrologFacts(schedule) {
    let facts = '';
    schedule.activities.forEach((activity, index) => {
        const sanitizedName = activity.name.replace(/'/g, "\\'");
        facts += `activity(${index}, '${sanitizedName}', '${activity.type}', ${activity.startTime}, ${activity.duration}, ${activity.importance}).\n`;
    });
    console.log('Generated facts:', facts);
    return facts;
}

function parsePrologOutput(output) {
    const results = {
        conflicts: [],
        restWarnings: [],
        duplicates: [],
        suggestions: []
    };
    
    const lines = output.split('\n');
    console.log('Parsing Prolog output lines:', lines);
    
    lines.forEach(line => {
        line = line.trim();
        if (!line) return;
        
        if (line.startsWith('conflict:')) {
            results.conflicts.push(line.substring(9).trim());
        } else if (line.startsWith('rest_warning:')) {
            results.restWarnings.push(line.substring(12).trim());
        } else if (line.startsWith('duplicate:')) {
            results.duplicates.push(line.substring(10).trim());
        } else if (line.startsWith('suggestion:')) {
            results.suggestions.push(line.substring(11).trim());
        } else {
            console.log('Unmatched output line:', line);
        }
    });
    
    return results;
}

app.listen(port, () => {
    console.log(`Time Manager server running at http://localhost:${port}`);
}); 