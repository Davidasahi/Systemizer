import { ChangeDetectorRef, Component, ComponentFactoryResolver, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { PlacingService } from 'src/app/placing.service';
import { SelectionService } from 'src/app/selection.service';
import { BalancingAlgorithm } from 'src/models/enums/BalancingAlgorithm';
import { LoadBalancerType } from 'src/models/enums/LoadBalancerType';
import { LoadBalancer } from 'src/models/LoadBalancer';
import { OperatorComponent } from '../Shared/OperatorComponent';

@Component({
  	selector: 'loadbalancer',
	templateUrl: './loadbalancer.component.html',
	queries: {
		anchorRef: new ViewChild( "anchorRef" ),
		optionsRef: new ViewChild( "options" ),
	},
  	styleUrls: ['./loadbalancer.component.scss']
})
export class LoadbalancerComponent extends OperatorComponent implements OnInit {

	public LogicLoadBalancer : LoadBalancer = new LoadBalancer();
	
	@ViewChild("conn", { read: ViewContainerRef }) conn;

	constructor(placingService: PlacingService, selectionService: SelectionService, resolver: ComponentFactoryResolver, cdRef: ChangeDetectorRef){
		super(placingService, selectionService, resolver, cdRef);
  	}

	ngAfterViewInit(): void {
		super.Init(this.conn);
  	}

	ngOnInit(){
		this.cdRef.detectChanges();
	}

	getActionsElement(){
		return null;
	}

	handleTypeChange(){
		if(this.LogicLoadBalancer.options.type == LoadBalancerType['Layer 4'] && 
		this.LogicLoadBalancer.options.algorithm == BalancingAlgorithm['URL Hash']){
			this.LogicLoadBalancer.options.algorithm = BalancingAlgorithm['Round Robin'];
		}
	}

	public getLogicComponent(){
		return this.LogicLoadBalancer;
	}

	static getColor(): string{
		let c = new LoadBalancer();
		return c.color;
	}
}
