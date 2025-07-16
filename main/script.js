class AIToolGenerator {
    constructor() {
        this.tools = [];
        this.toolCounter = 0;
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateJSON();
    }

    bindEvents() {
        document.getElementById('add-tool-btn').addEventListener('click', () => this.addTool());
        document.getElementById('clear-all-btn').addEventListener('click', () => this.clearAll());
        document.getElementById('copy-json-btn').addEventListener('click', () => this.copyJSON());
        document.getElementById('download-json-btn').addEventListener('click', () => this.downloadJSON());
    }

    addTool() {
        const toolId = ++this.toolCounter;
        const toolData = {
            id: toolId,
            name: '',
            description: '',
            parameters: []
        };

        this.tools.push(toolData);
        this.renderTool(toolData);
        this.updateJSON();
    }

    renderTool(toolData) {
        const container = document.getElementById('tools-container');
        const toolElement = document.createElement('div');
        toolElement.className = 'tool-form';
        toolElement.setAttribute('data-tool-id', toolData.id);

        toolElement.innerHTML = `
            <div class="tool-header">
                <div class="tool-title">Tool ${toolData.id}</div>
                <button class="remove-tool-btn" onclick="generator.removeTool(${toolData.id})">Remove</button>
            </div>
            
            <div class="form-group">
                <label>Function Name:</label>
                <input type="text" class="tool-name" placeholder="e.g., add, subtract, multiply" 
                       onchange="generator.updateTool(${toolData.id}, 'name', this.value)">
            </div>
            
            <div class="form-group">
                <label>Description:</label>
                <textarea class="tool-description" placeholder="Describe what this function does" 
                          onchange="generator.updateTool(${toolData.id}, 'description', this.value)"></textarea>
            </div>
            
            <div class="parameters-section">
                <h3>Parameters</h3>
                <div class="parameters-container" id="params-${toolData.id}">
                    <!-- Parameters will be added here -->
                </div>
                <button class="add-param-btn" onclick="generator.addParameter(${toolData.id})">Add Parameter</button>
            </div>
        `;

        container.appendChild(toolElement);
    }

    updateTool(toolId, field, value) {
        const tool = this.tools.find(t => t.id === toolId);
        if (tool) {
            tool[field] = value;
            this.updateJSON();
        }
    }

    removeTool(toolId) {
        this.tools = this.tools.filter(t => t.id !== toolId);
        const toolElement = document.querySelector(`[data-tool-id="${toolId}"]`);
        if (toolElement) {
            toolElement.remove();
        }
        this.updateJSON();
    }

    addParameter(toolId) {
        const tool = this.tools.find(t => t.id === toolId);
        if (!tool) return;

        const paramId = Date.now();
        const parameter = {
            id: paramId,
            name: '',
            type: 'string',
            description: '',
            required: false
        };

        tool.parameters.push(parameter);
        this.renderParameter(toolId, parameter);
        this.updateJSON();
    }

    renderParameter(toolId, parameter) {
        const container = document.getElementById(`params-${toolId}`);
        const paramElement = document.createElement('div');
        paramElement.className = 'parameter-item';
        paramElement.setAttribute('data-param-id', parameter.id);

        paramElement.innerHTML = `
            <div class="parameter-controls">
                <input type="text" placeholder="Parameter name" value="${parameter.name}"
                       onchange="generator.updateParameter(${toolId}, ${parameter.id}, 'name', this.value)">
                <select onchange="generator.updateParameter(${toolId}, ${parameter.id}, 'type', this.value)">
                    <option value="string" ${parameter.type === 'string' ? 'selected' : ''}>String</option>
                    <option value="number" ${parameter.type === 'number' ? 'selected' : ''}>Number</option>
                    <option value="boolean" ${parameter.type === 'boolean' ? 'selected' : ''}>Boolean</option>
                    <option value="array" ${parameter.type === 'array' ? 'selected' : ''}>Array</option>
                    <option value="object" ${parameter.type === 'object' ? 'selected' : ''}>Object</option>
                </select>
                <label style="display: flex; align-items: center; gap: 5px;">
                    <input type="checkbox" ${parameter.required ? 'checked' : ''}
                           onchange="generator.updateParameter(${toolId}, ${parameter.id}, 'required', this.checked)">
                    Required
                </label>
                <button class="remove-param-btn" onclick="generator.removeParameter(${toolId}, ${parameter.id})">Remove</button>
            </div>
            <input type="text" placeholder="Parameter description" value="${parameter.description}"
                   onchange="generator.updateParameter(${toolId}, ${parameter.id}, 'description', this.value)"
                   style="margin-top: 8px;">
        `;

        container.appendChild(paramElement);
    }

    updateParameter(toolId, paramId, field, value) {
        const tool = this.tools.find(t => t.id === toolId);
        if (!tool) return;

        const parameter = tool.parameters.find(p => p.id === paramId);
        if (parameter) {
            parameter[field] = value;
            this.updateJSON();
        }
    }

    removeParameter(toolId, paramId) {
        const tool = this.tools.find(t => t.id === toolId);
        if (!tool) return;

        tool.parameters = tool.parameters.filter(p => p.id !== paramId);
        const paramElement = document.querySelector(`[data-param-id="${paramId}"]`);
        if (paramElement) {
            paramElement.remove();
        }
        this.updateJSON();
    }

    generateJSON() {
        return this.tools.map(tool => {
            const properties = {};
            const required = [];

            tool.parameters.forEach(param => {
                if (param.name) {
                    properties[param.name] = {
                        type: param.type
                    };
                    
                    if (param.description) {
                        properties[param.name].description = param.description;
                    }
                    
                    if (param.required) {
                        required.push(param.name);
                    }
                }
            });

            return {
                type: "function",
                function: {
                    name: tool.name || "unnamed_function",
                    description: tool.description || "No description provided",
                    parameters: {
                        type: "object",
                        strict: true,
                        properties: properties,
                        required: required,
                        additionalProperties: false
                    }
                }
            };
        });
    }

    updateJSON() {
        const jsonOutput = document.getElementById('json-output');
        const generatedJSON = this.generateJSON();
        jsonOutput.textContent = JSON.stringify(generatedJSON, null, 2);
    }

    copyJSON() {
        const jsonOutput = document.getElementById('json-output');
        navigator.clipboard.writeText(jsonOutput.textContent).then(() => {
            const btn = document.getElementById('copy-json-btn');
            const originalText = btn.textContent;
            btn.textContent = 'Copied!';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 2000);
        });
    }

    downloadJSON() {
        const jsonOutput = document.getElementById('json-output');
        const blob = new Blob([jsonOutput.textContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ai-tools.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    clearAll() {
        if (confirm('Are you sure you want to clear all tools?')) {
            this.tools = [];
            this.toolCounter = 0;
            document.getElementById('tools-container').innerHTML = '';
            this.updateJSON();
        }
    }
}

// Initialize the generator
const generator = new AIToolGenerator();
