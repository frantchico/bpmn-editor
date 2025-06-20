/**
 * Generates a minimal BPMN 2.0 XML for a new process.
 * Includes a process element with the given name, a start event, and an end event.
 * @param processName The name of the process.
 * @returns A string containing the BPMN XML.
 */
export function generateMinimalBpmnXml(processName: string): string {
  // Generate a more unique ID by combining timestamp with a random number
  const uniqueSuffix = `${new Date().getTime()}_${Math.floor(Math.random() * 10000)}`;
  const processId = `Process_${uniqueSuffix}`;
  const definitionsId = `Definitions_${uniqueSuffix}`;
  const startEventId = `StartEvent_1`;
  const endEventId = `EndEvent_1`;

  // Sanitize processName for XML attributes if necessary, though typically names don't need heavy sanitization.
  // For simplicity, direct usage is shown here. Consider an XML escaping function if names can contain special characters.
  const sanitizedProcessName = processName.replace(/[<>&"']/g, (match) => {
    switch (match) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '"': return '&quot;';
      case "'": return '&apos;';
      default: return match;
    }
  });


  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  id="${definitionsId}"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="${processId}" name="${sanitizedProcessName}" isExecutable="true">
    <bpmn:startEvent id="${startEventId}" name="Start">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="${startEventId}" targetRef="${endEventId}" />
    <bpmn:endEvent id="${endEventId}" name="End" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="${processId}">
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="178" y="100" />
        <di:waypoint x="228" y="100" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNShape id="${startEventId}_di" bpmnElement="${startEventId}">
        <dc:Bounds x="142" y="82" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="148" y="125" width="24" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="${endEventId}_di" bpmnElement="${endEventId}">
        <dc:Bounds x="228" y="82" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="237" y="125" width="19" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
}
