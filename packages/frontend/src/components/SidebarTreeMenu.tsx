import React, { useEffect, useState } from 'react';
import { projectService } from '@/services/projectService';
import { areaService } from '@/services/areaService';
import { subAreaService } from '@/services/subAreaService';
import type { Project, Area, SubArea } from '@/types';
import { useNavigation, ViewType } from '@/context/NavigationContext';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronRight, Folder, FileText, Briefcase } from 'lucide-react';

interface TreeNode {
  id: string;
  name: string;
  type: 'project' | 'area' | 'subarea';
  children: TreeNode[];
  originalData: Project | Area | SubArea;
}

const SidebarTreeMenu: React.FC = () => {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeNode, setActiveNode] = useState<{ id: string; type: string } | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const { navigateTo, currentView } = useNavigation(); // Get navigateTo and currentView from context

  useEffect(() => {
    // Sync sidebar's activeNode with the global navigation state
    if (currentView.itemId &&
        (currentView.view === 'project' || currentView.view === 'area' || currentView.view === 'subarea')) {
      // Only update if the globally current item is different from the locally highlighted one
      if (activeNode?.id !== currentView.itemId || activeNode?.type !== currentView.view) {
         setActiveNode({ id: currentView.itemId, type: currentView.view as 'project' | 'area' | 'subarea' });
      }
    } else if (currentView.view === 'general' && !currentView.itemId) {
      // If on general dashboard without a specific item context, clear local highlight
      if (activeNode !== null) {
          setActiveNode(null);
      }
    }
  }, [currentView, activeNode, setActiveNode]); // setActiveNode added to deps as it's a setter from useState


  useEffect(() => {
    const fetchDataAndBuildTree = () => {
      setIsLoading(true);
      try {
        const projects = projectService.getProjects();
        const areas = areaService.getAreas();
        const subAreas = subAreaService.getSubAreas();

        const buildTree = (): TreeNode[] => {
          return projects.map(project => ({
            id: project.id,
            name: project.name,
            type: 'project',
            originalData: project,
            children: areas
              .filter(area => area.projectId === project.id)
              .map(area => ({
                id: area.id,
                name: area.name,
                type: 'area',
                originalData: area,
                children: subAreas
                  .filter(subArea => subArea.areaId === area.id)
                  .map(subArea => ({
                    id: subArea.id,
                    name: subArea.name,
                    type: 'subarea',
                    originalData: subArea,
                    children: [],
                  })),
              })),
          }));
        };
        setTreeData(buildTree());
      } catch (error) {
        console.error("Error fetching or building tree data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDataAndBuildTree();
  }, []);

  const handleNodeClick = (node: TreeNode) => {
    setActiveNode({ id: node.id, type: node.type }); // Set local active state for sidebar styling

    let viewType: ViewType = 'general'; // Default
    switch (node.type) {
      case 'project':
        viewType = 'project';
        break;
      case 'area':
        viewType = 'area';
        break;
      case 'subarea':
        viewType = 'subarea';
        break;
    }
    navigateTo({ view: viewType, itemId: node.id });
  };

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const renderTreeNodes = (nodes: TreeNode[], level = 0): JSX.Element[] => {
    return nodes.map(node => (
      <Collapsible
        key={node.id}
        open={expandedNodes[node.id] || false}
        onOpenChange={() => toggleExpand(node.id)}
        className="w-full"
      >
        <div
          className={`flex items-center w-full rounded-md hover:bg-gray-100 dark:hover:bg-gray-700
                      ${activeNode?.id === node.id ? 'bg-blue-100 dark:bg-blue-800' : ''}`}
          style={{ paddingLeft: `${level * 0.75}rem` }}
        >
          <CollapsibleTrigger asChild>
            {/* The onClick for the trigger is handled by onOpenChange on Collapsible for expansion.
                The clickable div for navigation and styling is nested. */}
            <div> {/* This div is the child for CollapsibleTrigger */}
              <div
                className={`flex items-center flex-grow p-1.5 text-sm cursor-pointer rounded-md
                             ${activeNode?.id === node.id && activeNode?.type === node.type ? 'font-semibold bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}
                          `}
                onClick={() => handleNodeClick(node)} // Navigation and local active state
              >
                {node.children.length > 0 ? (
                <ChevronRight
                    className={`h-4 w-4 mr-1.5 transform transition-transform duration-200 ${expandedNodes[node.id] ? 'rotate-90' : ''}`}
                  />
                ) : (
                  <span className="w-[16px] mr-1.5"></span>
                )}

                {node.type === 'project' && <Briefcase className="h-4 w-4 mr-1.5 text-blue-600 dark:text-blue-400" />}
                {node.type === 'area' && <Folder className="h-4 w-4 mr-1.5 text-yellow-600 dark:text-yellow-400" />}
                {node.type === 'subarea' && <FileText className="h-4 w-4 mr-1.5 text-green-600 dark:text-green-400" />}
                <span className="truncate">{node.name}</span>
              </div>
            </div>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="pl-[0.75rem]"> {/* Indent content slightly more for visual hierarchy */}
          {node.children.length > 0 && renderTreeNodes(node.children, level + 1)}
        </CollapsibleContent>
      </Collapsible>
    ));
  };

  if (isLoading) {
    return <div className="p-4 text-sm text-gray-500 dark:text-gray-400">Loading tree...</div>;
  }

  if (treeData.length === 0) {
    return <div className="p-4 text-sm text-gray-500 dark:text-gray-400">No projects found.</div>;
  }

  return (
    <div className="w-full p-2 space-y-0.5">
      {renderTreeNodes(treeData)}
    </div>
  );
};

export default SidebarTreeMenu;
