import java.lang.IndexOutOfBoundsException;
import java.lang.IllegalArgumentException;

/**
 * Pathfinder uses A* search to find a near optimal path
 * between to locations with given terrain.
 */

public class Pathfinder {

    private final Terrain terrain;
    private float heuristic = 1f;
    private MinPQ<PFNode> pq;
    private PFNode[][] nodesSearched;   //everything that's been on minpq or actually visited
    private int searchSize = 0;
    private PFNode current;
    private Coord source;
    private Coord destination;
    private boolean foundPath = false;
    private float finalCost;

    /**
     * PFNode will be the key for MinPQ (used in computePath())
     */
    private class PFNode implements Comparable<PFNode> {

        // loc: the location of the PFNode
        // fromNode: how did we get here? (linked list back to start)

        private final Coord loc;
        private final PFNode fromNode;
        private final float cost;
        private final float costToEnd;
        private boolean valid = true;
        private boolean used = false;

        public PFNode(Coord loc, PFNode fromNode) {
            this.loc = loc;
            this.fromNode = fromNode;
            if (this.loc.equals(source)) {
                this.cost = (float) 0;
                this.costToEnd = -1;    // irrelevant for source node
            } else {
                this.cost = this.fromNode.cost + terrain.computeTravelCost(fromNode.loc, this.loc);
                this.costToEnd = terrain.computeDistance(this.loc, destination);
            }
        }

        // compares this with that, used to find minimum cost PFNode
        public int compareTo(PFNode that) {
            if (this.cost == that.cost) return 0;
            return this.getCost(heuristic) > that.getCost(heuristic) ? 1 : -1;
        }

        // returns the cost to travel from starting point to this
        // via the fromNode chain
        public float getCost(float heuristic) {
            return this.cost + heuristic * this.costToEnd;
        }

        // returns if this PFNode is still valid
        public boolean isValid() {
            return this.valid;
        }

        // invalidates the PFNode
        public void invalidate() {
            this.valid = false;
        }

        // returns if the PFNode has been used (visited)
        public boolean isUsed() {
            return this.used;
        }

        // uses (visits) the PFNode
        public void use() {
            this.used = true;
        }

        // returns an Iterable of PFnodesSearched that surround this
        public Iterable<PFNode> neighbors() {
            Stack<PFNode> s = new Stack<>();

            int i = this.loc.getI();
            int j = this.loc.getJ();
            int n = terrain.getN();

            if (checkLocation(i+1, j, n)) {
                s.push(new PFNode(new Coord(i+1, j), this));
            }
            if (checkLocation(i, j+1, n)) {
                s.push(new PFNode(new Coord(i, j+1), this));
            }
            if (checkLocation(i-1, j, n)) {
                s.push(new PFNode(new Coord(i-1, j), this));
            }
            if (checkLocation(i, j-1, n)) {
                s.push(new PFNode(new Coord(i, j-1), this));
            }

            return s;
        }

        private boolean checkLocation(int i, int j, int n) {

            if (i < 0 || i > n-1 || j < 0 || j > n-1) return false;
            if (nodesSearched[i][j] != null) return false;
            return true;

        }
    }

    public Pathfinder(Terrain terrain) {
        this.terrain = terrain;
        int n = terrain.getN();
        this.nodesSearched = new PFNode[n][n];
    }

    public void setPathStart(Coord loc) {
        if (loc == null) throw new IllegalArgumentException("Null coordinates");
        // TODO: Add is in bounds check for loc
        this.source = loc;
        this.current = new PFNode(loc, null);
    }

    public Coord getPathStart() {
        return this.source;
    }

    public void setPathEnd(Coord loc) {
        this.destination = loc;
    }

    public Coord getPathEnd() {
        return this.destination;
    }

    public void setHeuristic(float v) {
        this.heuristic = v;
    }

    public float getHeuristic() {
        return this.heuristic;
    }

    public void resetPath() {
        pq = new MinPQ<>();
        nodesSearched = new PFNode[terrain.getN()][terrain.getN()];
        this.current = new PFNode(source, null);
        this.finalCost = 0;
        this.searchSize = 0;
        // does garbage collector take everything at this point? otherwise theres a lot of extra overhead
    }

    public void computePath() {

        // add first set of nodes to pq using source
        this.current = new PFNode(this.source, null);
        // check if source is destination
        if (this.current.loc.equals(this.destination)) {
            this.foundPath = true;
            return;
        }
        Iterable<PFNode> newNeighbors = this.current.neighbors();
        for (PFNode n : newNeighbors) {
            pq.insert(n);
            nodesSearched[n.loc.getI()][n.loc.getJ()] = n;
            searchSize++;
        }

        while (!this.pq.isEmpty()) {
            this.current = pq.delMin();
            if (this.current.loc.equals(this.destination)) break;
            if (nodesSearched[this.current.loc.getI()][this.current.loc.getJ()].isUsed()) continue; // node already visited
            
            // add this.current set of neighbors
            this.current.used = true;
            newNeighbors = this.current.neighbors();
            for (PFNode n : newNeighbors) {
                pq.insert(n);
                nodesSearched[n.loc.getI()][n.loc.getJ()] = n;
                searchSize++;
            }
        }

        if (this.current.loc.equals(this.destination)) {
            this.foundPath = true;
            this.finalCost = this.current.cost;
        }

    }

    public boolean foundPath() {
        return this.foundPath;
    }

    public float getPathCost() {
        return this.finalCost;
    }

    public int getSearchSize() {
        return this.searchSize;
    }

    public Iterable<Coord> getPathSolution() {
        Stack<Coord> path = new Stack<>();
        while (current != null) {
            path.push(current.loc);
            current = current.fromNode;
        }
        return path;
    }

    public boolean wasSearched(Coord loc) {
        return nodesSearched[loc.getI()][loc.getJ()] != null;
    }
}
