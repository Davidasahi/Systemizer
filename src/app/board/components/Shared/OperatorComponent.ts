import { ComponentFactoryResolver, ElementRef, EventEmitter, ViewContainerRef } from "@angular/core";
import { PlacingService } from "src/app/placing.service";
import { SelectionService } from "src/app/selection.service";
import { IDataOperator } from "src/interfaces/IDataOperator";
import { Endpoint, MQEndpoint } from "src/models/Endpoint";
import { APIType } from "src/models/enums/APIType";
import { BalancingAlgorithm } from "src/models/enums/BalancingAlgorithm";
import { DatabaseType } from "src/models/enums/DatabaseType";
import { gRPCMode } from "src/models/enums/gRPCMode";
import { EndpointActionHTTPMethod, HTTPMethod } from "src/models/enums/HTTPMethod";
import { HTTPStatus } from "src/models/enums/HTTPStatus";
import { LoadBalancerType } from "src/models/enums/LoadBalancerType";
import { Protocol } from "src/models/enums/Protocol";
import { ReplacementPolicy } from "src/models/enums/ReplacementPolicy";
import { WritePolicy } from "src/models/enums/WritePolicy";
import { Options } from "src/models/Options";
import { clone, getFormattedMethod } from "src/shared/ExtensionMethods";
import { PortComponent } from "../port/port.component";
import { TitleComponent } from "./title/title.component";

interface Position{
    top: number;
    left: number;
}

export class OperatorComponent {

	hasChanged = new EventEmitter();
	showContextMenu = new EventEmitter();

    board: HTMLElement;
	comp: HTMLElement

	public HTTPMethod: typeof HTTPMethod = HTTPMethod;
	public HTTPMethodKeys = Object.values(HTTPMethod).filter(k => !isNaN(Number(k)));
	public EndpointActionHTTPMethod: typeof EndpointActionHTTPMethod = EndpointActionHTTPMethod;
	public EndpointActionHTTPMethodKeys = Object.values(EndpointActionHTTPMethod).filter(k => !isNaN(Number(k)));
	public Protocol: typeof Protocol = Protocol;
	public ProtocolKeys = Object.values(Protocol).filter(k => !isNaN(Number(k)));
	public APIType: typeof APIType = APIType;
	public APITypeKeys = Object.values(APIType).filter(k => !isNaN(Number(k)));
	public gRPCMode: typeof gRPCMode = gRPCMode;
	public gRPCModeKeys = Object.values(gRPCMode).filter(k => !isNaN(Number(k)));
	public LoadBalancerType: typeof LoadBalancerType = LoadBalancerType;
	public LoadBalancerTypeKeys = Object.values(LoadBalancerType).filter(k => !isNaN(Number(k)));
	public BalancingAlgorithm: typeof BalancingAlgorithm = BalancingAlgorithm;
	public BalancingAlgorithmKeys = Object.values(BalancingAlgorithm).filter(k => !isNaN(Number(k)));
	public DatabaseType: typeof DatabaseType = DatabaseType;
	public DatabaseTypeKeys = Object.values(DatabaseType).filter(k => !isNaN(Number(k)));
	public WritePolicy: typeof WritePolicy = WritePolicy;
	public WritePolicyKeys = Object.values(WritePolicy).filter(k => !isNaN(Number(k)));
	public ReplacementPolicy: typeof ReplacementPolicy = ReplacementPolicy;
	public ReplacementPolicyKeys = Object.values(ReplacementPolicy).filter(k => !isNaN(Number(k)));

    public placingService: PlacingService;
    private selectionService: SelectionService;
	private resolver: ComponentFactoryResolver;

	conn: ViewContainerRef;

    public anchorMouseOffset: Position;
	public anchorRef!: ElementRef;

	private LogicComponent: IDataOperator;
	public optionsRef: ElementRef;
	public actionsRef: ElementRef;
	public inputPortRef: PortComponent;
	public outputPortRef: PortComponent;

	private maxX = 0;
	private maxY = 0;

	public anchorRect: any;

	public isReadOnly = false;

	public beforeOptions: Options;

    constructor(placingService: PlacingService, selectionService: SelectionService, resolver: ComponentFactoryResolver) {
		this.placingService = placingService;
        this.selectionService = selectionService;
		this.resolver = resolver
	}

  	public handleMousedown(event: Event): void {
		if(this.placingService.isConnecting) 
			return;
		event.preventDefault();
		this.handleClick(event);
		this.placingService.startPlacing();

		this.anchorRect = this.anchorRef.nativeElement.getBoundingClientRect();
		this.maxX = this.placingService.boardWidth;
		this.maxY = this.placingService.boardHeight;
		if(event instanceof MouseEvent){
			if(event.button != 0){
				event.preventDefault();
				if(event.button == 2){
					this.selectionService.addSelection(this, false);
					this.showContextMenu.emit(event);
				}
				return;
			}
	
			this.selectionService.prevX = event.clientX;
			this.selectionService.prevY = event.clientY;
	
			this.board.addEventListener( "mousemove", this.handleMousemove );
			window.addEventListener( "mouseup", this.handleMouseup );
		}
		else if(event instanceof TouchEvent){

			this.selectionService.prevX = event.touches[0].clientX;
			this.selectionService.prevY = event.touches[0].clientY;
	
			this.board.addEventListener( "touchmove", this.handleMousemove );
			window.addEventListener( "touchend", this.handleMouseup );
		}
	}

  	public handleMousemove = (event: Event): void => {
		this.selectionService.moveComponents(event, this.placingService.boardScale);
	}

	private convertPosition(number){
		return Math.round(number / 10) * 10;
	}

	public setPosition(x: number, y: number){
		this.LogicComponent.options.X = Math.max(Math.min( this.maxX - this.anchorRect.width  / this.placingService.boardScale, this.convertPosition(x)), 0);
		this.LogicComponent.options.Y = Math.max(Math.min( this.maxY - this.anchorRect.height / this.placingService.boardScale, this.convertPosition(y)), 0);
	}

	public handleMouseup = (): void => {
		this.placingService.stopPlacing();

		this.board.removeEventListener( "mousemove", this.handleMousemove );
		window.removeEventListener( "mouseup", this.handleMouseup );

		if(this.beforeOptions.X !== this.LogicComponent.options.X || this.beforeOptions.Y !== this.LogicComponent.options.Y){
			this.afterChange();
		}		
	}

	public handleClick(event: Event){
		if(event instanceof MouseEvent || event instanceof TouchEvent)
			this.selectionService.addSelection(this, event.ctrlKey);
	}

	public getLogicComponent(): IDataOperator{
		return null;
	}

	public getPortComponent(getOutput = false){
		if(getOutput && this.outputPortRef != null)
			return this.outputPortRef.getPortComponent();
		else if(!getOutput && this.inputPortRef != null)
			return this.inputPortRef.getPortComponent();
		return null;
	}

	public onViewInit = [];

	/**
	 * 
	 * @returns options element, null if component doesnt have any options
	 */
	public getOptionsElement(): ElementRef{
		return this.optionsRef;
	}

	/**
	 * 
	 * @returns actions element, null if component doesnt have any actions
	 */
	public getActionsElement(): ElementRef{
		return this.actionsRef;
	}

	destroyComponent = () => {}

	changeTitle(title: string){
		this.LogicComponent.options.title = title;
	}

	showStatusCode(code: HTTPStatus){
		let span = document.createElement("span");
		span.classList.add("status-code-side");
		let type: string;
		if(code >= 0 && code < 1000){ // Classic status codes 
			if(code >= 100 && code < 200)
				type = "info";
			else if(code >= 200 && code < 300)
				type = "success";
			else if(code >= 300 && code < 400)
				type = "warning";
			else if(code >= 400 && code < 500)
				type = "error";
			else
				type = "error";
			span.innerHTML = `<span class="code ${type}">${code}</span><br/>${HTTPStatus[code]}`;
		}
		else if(code >= 1000 && code < 2000){ // Cache status codes
			if(code == 1200)
				span.innerHTML = `<span class="code success">HIT</span>`;
			else if(code == 1404)
				span.innerHTML = `<span class="code error">MISS</span>`;
		}
		this.anchorRef.nativeElement.appendChild(span);
		setTimeout(() => {
			this.anchorRef.nativeElement.removeChild(span);
		}, 1500);
	}

	destroySelf = () => {
		this.LogicComponent.destroy();
		this.destroyComponent();
	}

	Init(conn: ViewContainerRef, generateTitle: boolean = true): void {
		this.conn = conn;
		this.LogicComponent = this.getLogicComponent();
		this.board = document.getElementById("board");
		this.comp = this.anchorRef.nativeElement;
		this.comp.classList.add("component");
		if(this.LogicComponent.fillColor){
			this.comp.style.backgroundColor = this.LogicComponent.color;
		}
		else{
			this.comp.classList.add("bordered")
			Array.from(this.comp.getElementsByClassName("img")).forEach(el => {
				(el as HTMLElement).style.backgroundColor = this.LogicComponent.color;
			});
			this.comp.style.border = "2px solid " + this.LogicComponent.color;
		}
		if(this.isReadOnly)
			this.comp.classList.add("read-only")
		this.anchorRect = this.anchorRef.nativeElement.getBoundingClientRect();
		this.maxX = this.placingService.boardWidth;
		this.maxY = this.placingService.boardHeight;
		this.LogicComponent.onShowStatusCode((code:HTTPStatus)=>{
			this.showStatusCode(code);
		});

		this.LogicComponent.onReceiveData((data) => {
			if(!this.comp.classList.contains("anim")){
				this.comp.classList.add("anim");
				setTimeout(()=>{
					this.comp.classList.remove("anim");
				},500);
			}
    	});

		this.LogicComponent.onFailedConnect((data) => {
			this.placingService.showSnack(data.message);
    	});

		this.beforeOptions = clone(this.LogicComponent.options);

		let inputPort = this.LogicComponent["inputPort"];
		let outputPort = this.LogicComponent["outputPort"];

		if(this.conn == null)
			return;
		
		if(generateTitle)
			setTimeout(()=>{this.generateTitle();}, 100); 

		if(inputPort != null)
			this.createPort(false);
		if(outputPort != null)
			this.createPort(true);
		this.onViewInit.forEach(e => e());
	}

	createPort(output = false){
		let factory  = this.resolver.resolveComponentFactory(PortComponent);
		let ref = this.conn.createComponent(factory);

		ref.instance.IsOutput = output;
		ref.instance.LogicParent = this.LogicComponent;
		ref.instance.IsReadOnly = this.isReadOnly;
		ref.instance.LogicPort = this.LogicComponent[output ? "outputPort" : "inputPort"];

		ref.instance.destroySelf = () => {
			ref.destroy();
		}

		ref.location.nativeElement.classList.add(output ? "right" : "left");

		if(output)
			this.outputPortRef = ref.instance;
		else
			this.inputPortRef = ref.instance;
	}

	generateTitle(){
		let factory  = this.resolver.resolveComponentFactory(TitleComponent);
		let ref = this.conn.createComponent(factory);

		ref.instance.Model = this.LogicComponent;
	}

	formatMethod(method: HTTPMethod, isDatabase: boolean){
		return getFormattedMethod(method, isDatabase);
	}

	isMQEndpoint(endpoint: Endpoint){
		return endpoint instanceof MQEndpoint;
	}

	afterChange(){
		this.hasChanged.emit();
		this.beforeOptions = clone(this.LogicComponent.options);
	}

	static getColor(): string{
		return "6059DF";
	}
}