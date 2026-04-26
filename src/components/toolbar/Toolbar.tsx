import { tools, ToolDefinition } from './tools';
import { useEditorStore } from '../../store/editorStore';
import { useToastStore, TOOL_HINTS } from '../../store/toastStore';

export function Toolbar() {
  const { activeTool, setActiveTool } = useEditorStore();
  const { addToast } = useToastStore();

  const handleToolClick = (toolId: string) => {
    setActiveTool(toolId as any);
    const hint = TOOL_HINTS[toolId];
    if (hint) {
      addToast({
        message: hint.激活,
        type: 'hint',
        duration: 3000,
      });
    }
  };

  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
      <div className="panel p-2 flex flex-col gap-1">
        {tools.map((tool) => (
          <ToolButton
            key={tool.id}
            tool={tool}
            isActive={activeTool === tool.id}
            onClick={() => handleToolClick(tool.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface ToolButtonProps {
  tool: ToolDefinition;
  isActive: boolean;
  onClick: () => void;
}

function ToolButton({ tool, isActive, onClick }: ToolButtonProps) {
  const Icon = tool.icon;

  return (
    <button
      onClick={onClick}
      className={`
        w-10 h-10 flex items-center justify-center rounded-tahoe
        transition-all duration-150 group relative
        ${isActive
          ? 'bg-tahoe-accent text-white'
          : 'text-tahoe-text-secondary hover:bg-gray-100 hover:text-tahoe-text'
        }
      `}
      title={`${tool.label} (${tool.shortcut})`}
    >
      <Icon size={20} weight={isActive ? 'fill' : 'regular'} />

      <div className="absolute left-full ml-2 px-2 py-1 bg-tahoe-text text-tahoe-bg text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        {tool.label} <span className="text-tahoe-text-secondary">({tool.shortcut})</span>
      </div>
    </button>
  );
}
