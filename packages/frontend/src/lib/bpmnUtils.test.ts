import { generateMinimalBpmnXml } from './bpmnUtils'; // Adjust path as necessary
import { parseStringPromise as xmlParse } from 'xml2js'; // For XML validation

describe('BPMN Utilities', () => {
  describe('generateMinimalBpmnXml', () => {
    it('should generate valid XML', async () => {
      const processName = 'Test Process';
      const xmlString = generateMinimalBpmnXml(processName);
      // Basic check: is it a non-empty string?
      expect(xmlString).toBeTypeOf('string');
      expect(xmlString.length).toBeGreaterThan(0);

      // Attempt to parse the XML to check for well-formedness
      let parseError = null;
      try {
        await xmlParse(xmlString);
      } catch (e) {
        parseError = e;
      }
      expect(parseError, 'Generated XML should be well-formed').toBeNull();
    });

    it('should include the process name in the bpmn:process element', () => {
      const processName = 'My Special Process';
      const xmlString = generateMinimalBpmnXml(processName);
      expect(xmlString).toContain(`<bpmn:process id="Process_`); // Check for process ID prefix
      expect(xmlString).toContain(`name="${processName}"`);
      expect(xmlString).toContain(`isExecutable="true"`);
    });

    it('should include a start event', () => {
      const xmlString = generateMinimalBpmnXml('Test Start Event');
      expect(xmlString).toContain('<bpmn:startEvent id="StartEvent_1" name="Start">');
    });

    it('should include an end event', () => {
      const xmlString = generateMinimalBpmnXml('Test End Event');
      expect(xmlString).toContain('<bpmn:endEvent id="EndEvent_1" name="End" />');
    });

    it('should include a sequence flow between start and end events', () => {
      const xmlString = generateMinimalBpmnXml('Test Flow');
      expect(xmlString).toContain('<bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="EndEvent_1" />');
    });

    it('should include BPMNDiagram elements for visualization', () => {
      const xmlString = generateMinimalBpmnXml('Test Diagram');
      expect(xmlString).toContain('<bpmndi:BPMNDiagram id="BPMNDiagram_1">');
      expect(xmlString).toContain('<bpmndi:BPMNPlane');
      expect(xmlString).toContain('<bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">');
      expect(xmlString).toContain('<bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">');
      expect(xmlString).toContain('<bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">');
    });

    it('should sanitize special XML characters in process name', () => {
      const processName = 'Process with <>&"\' characters';
      const expectedSanitizedName = 'Process with &lt;&gt;&amp;&quot;&apos; characters';
      const xmlString = generateMinimalBpmnXml(processName);
      expect(xmlString).toContain(`name="${expectedSanitizedName}"`);
    });

    it('should generate unique IDs for process and definitions over multiple calls', () => {
      const xmlString1 = generateMinimalBpmnXml('Process 1');
      const xmlString2 = generateMinimalBpmnXml('Process 2');

      // Regex to be more robust to attribute order and whitespace
      const processRegex = /<bpmn:process\s+[^>]*?\s*id="(Process_\d+_\d+)"/;
      const definitionsRegex = /<bpmn:definitions\s+[^>]*?\s*id="(Definitions_\d+_\d+)"/;

      const processId1Match = xmlString1.match(processRegex);
      const definitionsId1Match = xmlString1.match(definitionsRegex);
      const processId1 = processId1Match ? processId1Match[1] : null;
      const definitionsId1 = definitionsId1Match ? definitionsId1Match[1] : null;

      const processId2Match = xmlString2.match(processRegex);
      const definitionsId2Match = xmlString2.match(definitionsRegex);
      const processId2 = processId2Match ? processId2Match[1] : null;
      const definitionsId2 = definitionsId2Match ? definitionsId2Match[1] : null;

      expect(processId1).not.toBeNull();
      expect(definitionsId1).not.toBeNull();
      expect(processId2).not.toBeNull();
      expect(definitionsId2).not.toBeNull();

      expect(processId1).not.toEqual(processId2);
      expect(definitionsId1).not.toEqual(definitionsId2);
    });
  });
});
