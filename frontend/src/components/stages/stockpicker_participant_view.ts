import '../../pair-components/button';
import '../../pair-components/tooltip';
import '../progress/progress_stage_completed';
import './stage_description';
import './stage_footer';

import {MobxLitElement} from '@adobe/lit-mobx';
import {CSSResultGroup, html, nothing} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {classMap} from 'lit/directives/class-map.js';
import {ref, createRef} from 'lit/directives/ref.js';

import {core} from '../../core/core';
import {CohortService} from '../../services/cohort.service';
import {ParticipantAnswerService} from '../../services/participant.answer';
import {ParticipantService} from '../../services/participant.service';
import {
  StageKind,
  StockConfig,
  MonthlyPerformance,
  StockMetrics,
  StockpickerStageConfig,
  StockpickerStagePublicData
} from '@deliberation-lab/utils';

import {styles} from './stockpicker_view.scss';

/** Stock Picker stage view for participants. */
@customElement('stockpicker-participant-view')
export class StockpickerView extends MobxLitElement {
  static override styles: CSSResultGroup = [styles];

  private readonly cohortService = core.getService(CohortService);
  private readonly participantAnswerService = core.getService(
    ParticipantAnswerService,
  );
  private readonly participantService = core.getService(ParticipantService);

  @property() stage: StockpickerStageConfig | null = null;
  @state() currentStockIndex = 0;
  @state() showAllocationView = false;
  @state() allocations: Record<string, number> = {};
  @state() activeChartStock = '';
  @state() showConfirmModal = false;

  // Chart references
  private performanceChartRef = createRef<HTMLCanvasElement>();
  private donutChartRef = createRef<HTMLCanvasElement>();
  private allocationChartRef = createRef<HTMLCanvasElement>();
  
  // Chart instances
  private performanceChart: any = null;
  private donutChart: any = null;
  private allocationChart: any = null;

  override firstUpdated() {
    if (this.stage) {
      // Initialize allocations with default values
      const stocks = this.stage.stocks;
      const allocationsMap: Record<string, number> = {};
      stocks.forEach((stock: StockConfig) => {
        allocationsMap[stock.id] = 100 / stocks.length;
      });
      this.allocations = allocationsMap;
      this.activeChartStock = stocks[0].id;
      
      // Render initial charts after the DOM is updated
      setTimeout(() => {
        this.renderPerformanceChart();
        if (this.showAllocationView) {
          this.renderDonutChart();
          this.renderAllocationChart();
        }
      }, 0);
    }
  }

  override updated(changedProperties: Map<string, any>) {
    if (changedProperties.has('currentStockIndex') || 
        changedProperties.has('stage') ||
        changedProperties.has('showAllocationView')) {
      // Re-render charts when relevant properties change
      setTimeout(() => {
        if (!this.showAllocationView) {
          this.renderPerformanceChart();
        } else {
          this.renderDonutChart();
          this.renderAllocationChart();
        }
      }, 0);
    }
    
    if (changedProperties.has('allocations') && this.showAllocationView) {
      // Update allocation charts when allocations change
      setTimeout(() => {
        this.renderDonutChart();
      }, 0);
    }
    
    if (changedProperties.has('activeChartStock') && this.showAllocationView) {
      // Update the allocation performance chart when the active stock changes
      setTimeout(() => {
        this.renderAllocationChart();
      }, 0);
    }
  }

  override render() {
    if (!this.stage) {
      return nothing;
    }

    const publicData = this.cohortService.stagePublicDataMap[this.stage.id];
    if (!publicData || publicData.kind !== StageKind.STOCKPICKER) {
      return nothing;
    }

    return html`
      <stage-description .stage=${this.stage}></stage-description>
      ${this.showAllocationView
        ? this.renderAllocationView()
        : this.renderStockView()
      }
      <stage-footer>
        ${this.stage.progress.showParticipantProgress
          ? html`<progress-stage-completed></progress-stage-completed>`
          : nothing}
      </stage-footer>
      ${this.showConfirmModal ? this.renderConfirmationModal() : nothing}
    `;
  }

  private renderStockView() {
    if (!this.stage) return nothing;
    
    const currentStock = this.stage.stocks[this.currentStockIndex];
    const isLastStock = this.currentStockIndex === this.stage.stocks.length - 1;
    
    return html`
      <div class="stock-view">
        <h2>${currentStock.name} (${currentStock.ticker})</h2>
        
        <div class="metrics-row">
          <div class="metric-card">
            <h3>Best Year</h3>
            <div class="value">${currentStock.metrics.bestYearPerformance}</div>
          </div>
          <div class="metric-card">
            <h3>Worst Year</h3>
            <div class="value">${currentStock.metrics.worstYearPerformance}</div>
          </div>
          <div class="metric-card">
            <h3>Analyst Consensus</h3>
            <div class="value">${currentStock.metrics.analystConsensus}</div>
          </div>
          <div class="metric-card">
            <h3>Social Media Hype</h3>
            <div class="value">${currentStock.metrics.socialMediaHype}</div>
          </div>
        </div>
        
        <div class="content-row">
          <div class="chart-section">
            <h3>12-Month Performance ($1,000 investment)</h3>
            <div class="chart-container">
              <canvas ${ref(this.performanceChartRef)}></canvas>
            </div>
          </div>
          
          <div class="analysis-section">
            <h3>Risk Analysis</h3>
            <p>${currentStock.riskAnalysis}</p>
          </div>
        </div>
        
        <div class="navigation-buttons">
          <pr-button 
            variant="default"
            ?disabled=${this.currentStockIndex === 0}
            @click=${() => this.currentStockIndex--}
          >
            Previous Stock
          </pr-button>
          
          ${isLastStock 
            ? html`
              <pr-button @click=${this.goToAllocationView}>
                Proceed to Asset Allocation
              </pr-button>
            ` 
            : html`
              <pr-button @click=${() => this.currentStockIndex++}>
                Next Stock
              </pr-button>
            `
          }
        </div>
      </div>
    `;
  }

  private renderAllocationView() {
    if (!this.stage) return nothing;
    
    return html`
      <div class="allocation-view">
        <h2>Asset Allocation</h2>
        
        <div class="allocation-row">
          <div class="allocation-section">
            <h3>Portfolio Allocation</h3>
            <div class="donut-chart">
              <canvas ${ref(this.donutChartRef)}></canvas>
            </div>
          </div>
          
          <div class="allocation-section">
            <h3>Adjust Allocation</h3>
            ${this.stage.stocks.map(stock => this.renderSlider(stock))}
          </div>
          
          <div class="allocation-section">
            <h3>Performance Preview</h3>
            <div class="toggle-buttons">
              ${this.stage.stocks.map((stock: StockConfig) => html`
                <button 
                  class=${classMap({active: this.activeChartStock === stock.id})}
                  @click=${() => this.activeChartStock = stock.id}
                >
                  ${stock.ticker}
                </button>
              `)}
            </div>
            <div class="chart-container">
              <canvas ${ref(this.allocationChartRef)}></canvas>
            </div>
          </div>
        </div>
        
        <div class="navigation-buttons">
          <pr-button 
            variant="default"
            @click=${this.goBackToStockView}
          >
            Back to Stock Information
          </pr-button>
          
          <pr-button 
            @click=${this.openConfirmationModal}
          >
            Confirm Allocation
          </pr-button>
        </div>
      </div>
    `;
  }

  private renderSlider(stock: StockConfig) {
    const percentage = this.allocations[stock.id] || 0;
    
    const handleSliderChange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const newValue = parseInt(target.value);
      
      // Calculate the sum of all other allocations
      const total = Object.entries(this.allocations)
        .filter(([id]) => id !== stock.id)
        .reduce((sum, [_, value]) => sum + value, 0);
      
      // Create a new allocations object
      const newAllocations: Record<string, number> = {...this.allocations};
      newAllocations[stock.id] = newValue;
      
      // Adjust other allocations proportionally
      if (total > 0) {
        const otherStocks = Object.keys(this.allocations).filter(id => id !== stock.id);
        const remainingPercentage = 100 - newValue;
        
        if (remainingPercentage > 0) {
          // Scale factor to distribute remaining percentage among other stocks
          const scale = remainingPercentage / total;
          
          otherStocks.forEach(id => {
            newAllocations[id] = Math.round(this.allocations[id] * scale);
          });
          
          // Handle rounding errors by adjusting the last stock
          const newTotal = Object.values(newAllocations).reduce((sum, value) => sum + value, 0);
          if (newTotal !== 100 && otherStocks.length > 0) {
            const lastStock = otherStocks[otherStocks.length - 1];
            newAllocations[lastStock] += (100 - newTotal);
          }
        } else {
          // If new value is 100%, set all others to 0
          otherStocks.forEach(id => {
            newAllocations[id] = 0;
          });
        }
      }
      
      this.allocations = newAllocations;
    };
    
    return html`
      <div class="slider-container">
        <div class="stock-name">
          <span>${stock.name} (${stock.ticker})</span>
          <span class="percentage">${percentage}%</span>
        </div>
        <input 
          type="range" 
          min="0" 
          max="100" 
          .value=${percentage.toString()}
          @input=${handleSliderChange}
        >
      </div>
    `;
  }

  private renderConfirmationModal() {
    if (!this.stage) return nothing;
    
    return html`
      <div class="confirmation-modal">
        <div class="modal-content">
          <h2>Confirm Your Asset Allocation</h2>
          
          <div class="allocation-summary">
            ${this.stage.stocks.map((stock: StockConfig) => html`
              <div class="allocation-item">
                <span>${stock.name} (${stock.ticker})</span>
                <span class="percentage">${this.allocations[stock.id]}%</span>
              </div>
            `)}
          </div>
          
          <p>Once confirmed, you will not be able to change your allocation.</p>
          
          <div class="modal-buttons">
            <pr-button 
              variant="default"
              @click=${() => this.showConfirmModal = false}
            >
              Back to Editing
            </pr-button>
            
            <pr-button 
              @click=${this.confirmAllocation}
            >
              Confirm
            </pr-button>
          </div>
        </div>
      </div>
    `;
  }

  private goToAllocationView() {
    this.showAllocationView = true;
  }
  
  private goBackToStockView() {
    this.showAllocationView = false;
  }
  
  private openConfirmationModal() {
    this.showConfirmModal = true;
  }
  
  private async confirmAllocation() {
    if (!this.stage) return;
    
    try {
      // First update the allocations
      await this.participantService.setStockAllocation(
        this.stage.id,
        this.allocations
      );
      
      // Then confirm them
      await this.participantService.confirmStockAllocation(this.stage.id);
      
      // Close the modal and mark stage as completed
      this.showConfirmModal = false;
      this.participantService.markStageAsCompleted(this.stage.id);
    } catch (error) {
      console.error('Error confirming allocation:', error);
      // You might want to show an error message to the user
    }
  }

  private renderPerformanceChart() {
    if (!this.stage || !this.performanceChartRef.value) return;
    
    const currentStock = this.stage.stocks[this.currentStockIndex];
    const ctx = this.performanceChartRef.value.getContext('2d');
    
    if (!ctx) return;
    
    // Clean up previous chart if it exists
    if (this.performanceChart) {
      this.performanceChart.destroy();
    }
    
    // Extract data for the chart
    const labels = currentStock.historicalPerformance.map((item: MonthlyPerformance) => item.month);
    const data = currentStock.historicalPerformance.map((item: MonthlyPerformance) => item.value);
    
    // Create the chart using Chart.js (you'll need to add the library to your project)
    // This is a placeholder for the actual chart implementation
    // You would typically use a library like Chart.js
    this.simulateBarChart(ctx, labels, data);
  }

  private renderDonutChart() {
    if (!this.stage || !this.donutChartRef.value) return;
    
    const ctx = this.donutChartRef.value.getContext('2d');
    if (!ctx) return;
    
    // Clean up previous chart if it exists
    if (this.donutChart) {
      this.donutChart.destroy();
    }
    
    // Extract data for the chart
    const labels = this.stage.stocks.map((stock: StockConfig) => stock.ticker);
    const data = this.stage.stocks.map((stock: StockConfig) => this.allocations[stock.id] || 0);
    
    // Create the donut chart
    this.simulateDonutChart(ctx, labels, data);
  }

  private renderAllocationChart() {
    if (!this.stage || !this.allocationChartRef.value) return;
    
    const ctx = this.allocationChartRef.value.getContext('2d');
    if (!ctx) return;
    
    // Clean up previous chart if it exists
    if (this.allocationChart) {
      this.allocationChart.destroy();
    }
    
    // Find the active stock
    const activeStock = this.stage.stocks.find((stock: StockConfig) => stock.id === this.activeChartStock);
    if (!activeStock) return;
    
    // Extract data for the chart
    const labels = activeStock.historicalPerformance.map((item: MonthlyPerformance) => item.month);
    const data = activeStock.historicalPerformance.map((item: MonthlyPerformance) => item.value);
    
    // Create the performance chart for the selected stock
    this.simulateBarChart(ctx, labels, data);
  }

  // Simple chart rendering simulation functions
  // In a real implementation, you would use a charting library like Chart.js
  
  private simulateBarChart(ctx: CanvasRenderingContext2D, labels: string[], data: number[]) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const barWidth = width / labels.length - 10;
    const maxValue = Math.max(...data);
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw bars
    ctx.fillStyle = 'var(--md-sys-color-primary)';
    for (let i = 0; i < data.length; i++) {
      const barHeight = (data[i] / maxValue) * (height - 60);
      ctx.fillRect(
        i * (barWidth + 10) + 30,
        height - barHeight - 30,
        barWidth,
        barHeight
      );
    }
    
    // Draw x-axis labels
    ctx.fillStyle = 'var(--md-sys-color-on-surface)';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    for (let i = 0; i < labels.length; i++) {
      ctx.fillText(
        labels[i],
        i * (barWidth + 10) + 30 + barWidth / 2,
        height - 10
      );
    }
    
    // Draw y-axis
    ctx.beginPath();
    ctx.moveTo(20, 10);
    ctx.lineTo(20, height - 30);
    ctx.lineTo(width - 10, height - 30);
    ctx.strokeStyle = 'var(--md-sys-color-outline)';
    ctx.stroke();
  }
  
  private simulateDonutChart(ctx: CanvasRenderingContext2D, labels: string[], data: number[]) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const radius = Math.min(width, height) / 2 - 20;
    const total = data.reduce((sum, value) => sum + value, 0);
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw donut segments
    let startAngle = 0;
    const colors = [
      'var(--md-sys-color-primary)',
      'var(--md-sys-color-tertiary)',
      'var(--md-sys-color-secondary)',
      'var(--md-sys-color-error)',
    ];
    
    for (let i = 0; i < data.length; i++) {
      const sliceAngle = (data[i] / total) * 2 * Math.PI;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      
      // Add label
      const labelAngle = startAngle + sliceAngle / 2;
      const labelX = centerX + (radius * 0.7) * Math.cos(labelAngle);
      const labelY = centerY + (radius * 0.7) * Math.sin(labelAngle);
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (data[i] / total > 0.1) { // Only show label if segment is big enough
        ctx.fillText(`${labels[i]} ${data[i]}%`, labelX, labelY);
      }
      
      startAngle += sliceAngle;
    }
    
    // Draw inner circle for donut hole
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.5, 0, 2 * Math.PI);
    ctx.fillStyle = 'var(--md-sys-color-surface)';
    ctx.fill();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'stockpicker-participant-view': StockpickerView;
  }
}